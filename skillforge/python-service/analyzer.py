"""
analyzer.py

Strict object-oriented skill analysis engine for SkillForge.

The SkillAnalyzer class is intentionally self-contained (no FastAPI imports)
so it can be unit tested in isolation and reused outside the HTTP layer.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

# Proficiency thresholds shared with the frontend's copy in role catalog data.
DEFAULT_PROFICIENCY_THRESHOLD = 50  # a skill counts as "held" at/above this level
MIN_PROFICIENCY = 0
MAX_PROFICIENCY = 100


class SkillAnalysisError(ValueError):
    """Raised when the analysis payload is structurally invalid."""


@dataclass
class NormalizedSkill:
    name: str
    proficiency: int


@dataclass
class TopicScore:
    topic: str
    correct: int
    total: int
    percentage: float


@dataclass
class AnalysisResult:
    overall_readiness: float
    topic_scores: List[TopicScore]
    normalized_current_skills: List[NormalizedSkill]
    target_role: str
    matched_skills: List[str]
    missing_skills: List[Dict[str, Any]]
    proficiency_gaps: List[Dict[str, Any]]
    quiz_weight: float
    skills_weight: float
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Return a deterministic, JSON-serializable representation."""
        return {
            "overallReadiness": round(self.overall_readiness, 2),
            "topicScores": [
                {
                    "topic": t.topic,
                    "correct": t.correct,
                    "total": t.total,
                    "percentage": round(t.percentage, 2),
                }
                for t in self.topic_scores
            ],
            "normalizedCurrentSkills": [
                {"name": s.name, "proficiency": s.proficiency}
                for s in self.normalized_current_skills
            ],
            "targetRole": self.target_role,
            "matchedSkills": self.matched_skills,
            "missingSkills": self.missing_skills,
            "proficiencyGaps": self.proficiency_gaps,
            "weights": {
                "quiz": round(self.quiz_weight, 2),
                "skills": round(self.skills_weight, 2),
            },
            "warnings": self.warnings,
        }


class SkillAnalyzer:
    """
    Performs deterministic skill-gap analysis for a student against a
    target role's benchmark requirements.

    Responsibilities:
      - validate incoming payloads
      - normalize skill names (case/whitespace-insensitive matching)
      - calculate per-topic quiz percentages and an overall weighted
        readiness score
      - compare current proficiency against target-role benchmarks
      - compute missing skills using set operations plus proficiency
        thresholds
      - remain safe for empty skills, unknown roles, malformed scores,
        and boundary values
    """

    def __init__(
        self,
        proficiency_threshold: int = DEFAULT_PROFICIENCY_THRESHOLD,
        quiz_weight: float = 0.6,
        skills_weight: float = 0.4,
    ) -> None:
        if not (0 <= proficiency_threshold <= 100):
            raise SkillAnalysisError("proficiency_threshold must be between 0 and 100")
        if quiz_weight < 0 or skills_weight < 0:
            raise SkillAnalysisError("weights must be non-negative")
        total_weight = quiz_weight + skills_weight
        if total_weight == 0:
            raise SkillAnalysisError("quiz_weight and skills_weight cannot both be zero")

        self.proficiency_threshold = proficiency_threshold
        # normalize weights so they always sum to 1.0
        self.quiz_weight = quiz_weight / total_weight
        self.skills_weight = skills_weight / total_weight

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #

    def analyze(self, payload: Dict[str, Any]) -> AnalysisResult:
        """
        Main entry point. Accepts a validated-shape dict with keys:
          - current_skills: List[{name, proficiency}]
          - target_role: str
          - quiz_scores: List[{topic, correct, total}]
          - benchmark_skills: List[{skill, minProficiency}]
        Returns an AnalysisResult.
        """
        warnings: List[str] = []
        self._validate_payload(payload)

        target_role = str(payload.get("target_role") or "Unspecified Role").strip()
        if not target_role:
            target_role = "Unspecified Role"
            warnings.append("target_role was empty; defaulted to 'Unspecified Role'.")

        raw_skills = payload.get("current_skills") or []
        normalized_skills = self._normalize_skills(raw_skills, warnings)

        raw_quiz_scores = payload.get("quiz_scores") or []
        topic_scores = self._calculate_topic_scores(raw_quiz_scores, warnings)

        raw_benchmarks = payload.get("benchmark_skills") or []
        benchmarks = self._normalize_benchmarks(raw_benchmarks, warnings)

        matched_skills, missing_skills, proficiency_gaps = self._compare_to_benchmark(
            normalized_skills, benchmarks
        )

        quiz_component = self._weighted_quiz_average(topic_scores)
        skills_component = self._skills_readiness_component(
            normalized_skills, benchmarks
        )

        overall_readiness = self._compute_overall_readiness(
            quiz_component, skills_component, has_quiz=bool(topic_scores), has_benchmarks=bool(benchmarks)
        )

        return AnalysisResult(
            overall_readiness=overall_readiness,
            topic_scores=topic_scores,
            normalized_current_skills=normalized_skills,
            target_role=target_role,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            proficiency_gaps=proficiency_gaps,
            quiz_weight=self.quiz_weight,
            skills_weight=self.skills_weight,
            warnings=warnings,
        )

    # ------------------------------------------------------------------ #
    # Validation
    # ------------------------------------------------------------------ #

    def _validate_payload(self, payload: Any) -> None:
        if not isinstance(payload, dict):
            raise SkillAnalysisError("payload must be a JSON object")

        for list_field in ("current_skills", "quiz_scores", "benchmark_skills"):
            if list_field in payload and payload[list_field] is not None:
                if not isinstance(payload[list_field], list):
                    raise SkillAnalysisError(f"'{list_field}' must be a list if provided")

    # ------------------------------------------------------------------ #
    # Normalization
    # ------------------------------------------------------------------ #

    @staticmethod
    def normalize_skill_name(name: str) -> str:
        """
        Deterministic normalization used for matching skills across the
        student profile and the role benchmark: lowercase, trimmed,
        collapsed internal whitespace, punctuation-insensitive for
        common separators.
        """
        if not isinstance(name, str):
            return ""
        cleaned = name.strip().lower()
        cleaned = re.sub(r"[_\-./]+", " ", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned)
        return cleaned.strip()

    def _normalize_skills(
        self, raw_skills: List[Any], warnings: List[str]
    ) -> List[NormalizedSkill]:
        normalized: Dict[str, NormalizedSkill] = {}
        for entry in raw_skills:
            if not isinstance(entry, dict):
                warnings.append(f"Skipped malformed skill entry: {entry!r}")
                continue
            name = entry.get("name") or entry.get("skill")
            if not name or not isinstance(name, str):
                warnings.append(f"Skipped skill entry with missing name: {entry!r}")
                continue
            proficiency = entry.get("proficiency", 0)
            proficiency = self._safe_clamp_score(proficiency, warnings, context=f"skill '{name}'")
            key = self.normalize_skill_name(name)
            if not key:
                continue
            # If duplicate normalized names appear, keep the higher proficiency.
            if key in normalized:
                normalized[key].proficiency = max(normalized[key].proficiency, proficiency)
            else:
                normalized[key] = NormalizedSkill(name=name.strip(), proficiency=proficiency)
        return list(normalized.values())

    def _normalize_benchmarks(
        self, raw_benchmarks: List[Any], warnings: List[str]
    ) -> List[Dict[str, Any]]:
        benchmarks: List[Dict[str, Any]] = []
        seen_keys = set()
        for entry in raw_benchmarks:
            if not isinstance(entry, dict):
                warnings.append(f"Skipped malformed benchmark entry: {entry!r}")
                continue
            skill = entry.get("skill") or entry.get("name")
            if not skill or not isinstance(skill, str):
                warnings.append(f"Skipped benchmark entry with missing skill: {entry!r}")
                continue
            min_prof = entry.get("minProficiency", self.proficiency_threshold)
            min_prof = self._safe_clamp_score(min_prof, warnings, context=f"benchmark '{skill}'")
            key = self.normalize_skill_name(skill)
            if key in seen_keys:
                continue
            seen_keys.add(key)
            benchmarks.append({"skill": skill.strip(), "key": key, "minProficiency": min_prof})
        return benchmarks

    def _safe_clamp_score(self, value: Any, warnings: List[str], context: str) -> int:
        try:
            numeric = float(value)
            if math.isnan(numeric) or math.isinf(numeric):
                raise ValueError
        except (TypeError, ValueError):
            warnings.append(f"Non-numeric score for {context}; defaulted to 0.")
            return 0
        clamped = max(MIN_PROFICIENCY, min(MAX_PROFICIENCY, int(round(numeric))))
        if clamped != numeric:
            warnings.append(f"Score for {context} clamped to valid range [0,100].")
        return clamped

    # ------------------------------------------------------------------ #
    # Quiz scoring
    # ------------------------------------------------------------------ #

    def _calculate_topic_scores(
        self, raw_quiz_scores: List[Any], warnings: List[str]
    ) -> List[TopicScore]:
        topic_totals: Dict[str, Tuple[int, int]] = {}
        for entry in raw_quiz_scores:
            if not isinstance(entry, dict):
                warnings.append(f"Skipped malformed quiz score entry: {entry!r}")
                continue
            topic = entry.get("topic")
            if not topic or not isinstance(topic, str):
                warnings.append(f"Skipped quiz score entry with missing topic: {entry!r}")
                continue
            try:
                correct = int(entry.get("correct", 0))
                total = int(entry.get("total", 0))
            except (TypeError, ValueError):
                warnings.append(f"Non-integer correct/total for topic '{topic}'; skipped.")
                continue
            if total < 0 or correct < 0:
                warnings.append(f"Negative correct/total for topic '{topic}'; skipped.")
                continue
            if correct > total:
                warnings.append(
                    f"correct ({correct}) exceeded total ({total}) for topic '{topic}'; clamped."
                )
                correct = total

            prev_correct, prev_total = topic_totals.get(topic, (0, 0))
            topic_totals[topic] = (prev_correct + correct, prev_total + total)

        topic_scores: List[TopicScore] = []
        for topic, (correct, total) in topic_totals.items():
            percentage = (correct / total * 100.0) if total > 0 else 0.0
            topic_scores.append(
                TopicScore(topic=topic, correct=correct, total=total, percentage=percentage)
            )
        # deterministic ordering
        topic_scores.sort(key=lambda t: t.topic.lower())
        return topic_scores

    def _weighted_quiz_average(self, topic_scores: List[TopicScore]) -> float:
        graded = [t for t in topic_scores if t.total > 0]
        if not graded:
            return 0.0
        total_questions = sum(t.total for t in graded)
        if total_questions == 0:
            return 0.0
        weighted_sum = sum(t.percentage * t.total for t in graded)
        return weighted_sum / total_questions

    # ------------------------------------------------------------------ #
    # Benchmark comparison / gap analysis
    # ------------------------------------------------------------------ #

    def _compare_to_benchmark(
        self,
        normalized_skills: List[NormalizedSkill],
        benchmarks: List[Dict[str, Any]],
    ) -> Tuple[List[str], List[Dict[str, Any]], List[Dict[str, Any]]]:
        current_by_key: Dict[str, NormalizedSkill] = {
            self.normalize_skill_name(s.name): s for s in normalized_skills
        }
        current_keys = set(current_by_key.keys())
        benchmark_keys = {b["key"] for b in benchmarks}

        # Skills the student already lists that are also required, and meet threshold.
        matched_skills: List[str] = []
        proficiency_gaps: List[Dict[str, Any]] = []
        missing_skills: List[Dict[str, Any]] = []

        # Skills entirely absent from the profile: pure set subtraction.
        absent_keys = benchmark_keys - current_keys

        for benchmark in benchmarks:
            key = benchmark["key"]
            skill_label = benchmark["skill"]
            min_prof = benchmark["minProficiency"]

            if key in absent_keys:
                missing_skills.append(
                    {
                        "skill": skill_label,
                        "reason": "not_present",
                        "currentProficiency": 0,
                        "requiredProficiency": min_prof,
                        "gap": min_prof,
                    }
                )
                continue

            current_skill = current_by_key[key]
            if current_skill.proficiency < min_prof:
                proficiency_gaps.append(
                    {
                        "skill": skill_label,
                        "reason": "below_threshold",
                        "currentProficiency": current_skill.proficiency,
                        "requiredProficiency": min_prof,
                        "gap": min_prof - current_skill.proficiency,
                    }
                )
                missing_skills.append(
                    {
                        "skill": skill_label,
                        "reason": "below_threshold",
                        "currentProficiency": current_skill.proficiency,
                        "requiredProficiency": min_prof,
                        "gap": min_prof - current_skill.proficiency,
                    }
                )
            else:
                matched_skills.append(skill_label)

        # deterministic ordering for reproducible output
        matched_skills.sort(key=str.lower)
        missing_skills.sort(key=lambda m: (-m["gap"], m["skill"].lower()))
        proficiency_gaps.sort(key=lambda m: (-m["gap"], m["skill"].lower()))

        return matched_skills, missing_skills, proficiency_gaps

    def _skills_readiness_component(
        self,
        normalized_skills: List[NormalizedSkill],
        benchmarks: List[Dict[str, Any]],
    ) -> float:
        if not benchmarks:
            return 0.0
        current_by_key = {self.normalize_skill_name(s.name): s.proficiency for s in normalized_skills}
        ratios = []
        for benchmark in benchmarks:
            required = max(benchmark["minProficiency"], 1)  # avoid divide-by-zero
            current = current_by_key.get(benchmark["key"], 0)
            ratio = min(1.0, current / required)
            ratios.append(ratio)
        if not ratios:
            return 0.0
        return (sum(ratios) / len(ratios)) * 100.0

    def _compute_overall_readiness(
        self,
        quiz_component: float,
        skills_component: float,
        has_quiz: bool,
        has_benchmarks: bool,
    ) -> float:
        """
        Weighted readiness score. If one signal is missing (no quiz data
        or no benchmark data), fall back gracefully to the signal that
        is available rather than penalizing the student for missing data.
        """
        if has_quiz and has_benchmarks:
            return (quiz_component * self.quiz_weight) + (skills_component * self.skills_weight)
        if has_quiz:
            return quiz_component
        if has_benchmarks:
            return skills_component
        return 0.0
