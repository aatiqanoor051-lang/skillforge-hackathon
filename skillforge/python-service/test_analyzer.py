"""
test_analyzer.py

Unit tests for SkillAnalyzer. Run with: pytest test_analyzer.py -v
"""

import pytest

from analyzer import SkillAnalysisError, SkillAnalyzer


@pytest.fixture
def analyzer():
    return SkillAnalyzer()


def test_analyzer_rejects_invalid_weights():
    with pytest.raises(SkillAnalysisError):
        SkillAnalyzer(quiz_weight=0, skills_weight=0)


def test_analyzer_rejects_invalid_threshold():
    with pytest.raises(SkillAnalysisError):
        SkillAnalyzer(proficiency_threshold=150)


def test_analyze_rejects_non_dict_payload(analyzer):
    with pytest.raises(SkillAnalysisError):
        analyzer.analyze(["not", "a", "dict"])


def test_analyze_handles_completely_empty_payload(analyzer):
    result = analyzer.analyze({})
    data = result.to_dict()
    assert data["overallReadiness"] == 0.0
    assert data["targetRole"] == "Unspecified Role"
    assert data["missingSkills"] == []
    assert data["topicScores"] == []


def test_normalize_skill_name_is_case_and_separator_insensitive():
    assert SkillAnalyzer.normalize_skill_name("  Node.JS  ".strip()) == SkillAnalyzer.normalize_skill_name("node.js")
    assert SkillAnalyzer.normalize_skill_name("Data_Structures-Algorithms") == "data structures algorithms"
    assert SkillAnalyzer.normalize_skill_name("  React   Native ") == "react native"


def test_quiz_percentage_calculation(analyzer):
    payload = {
        "quiz_scores": [
            {"topic": "JavaScript", "correct": 3, "total": 5},
            {"topic": "JavaScript", "correct": 1, "total": 5},  # merged into same topic
            {"topic": "SQL", "correct": 2, "total": 4},
        ]
    }
    result = analyzer.analyze(payload)
    topics = {t.topic: t for t in result.topic_scores}
    assert topics["JavaScript"].total == 10
    assert topics["JavaScript"].correct == 4
    assert topics["JavaScript"].percentage == 40.0
    assert topics["SQL"].percentage == 50.0


def test_quiz_score_correct_exceeds_total_is_clamped(analyzer):
    payload = {"quiz_scores": [{"topic": "Python", "correct": 10, "total": 5}]}
    result = analyzer.analyze(payload)
    assert result.topic_scores[0].correct == 5
    assert result.topic_scores[0].percentage == 100.0
    assert any("exceeded total" in w for w in result.warnings)


def test_negative_scores_are_skipped_safely(analyzer):
    payload = {"quiz_scores": [{"topic": "Python", "correct": -1, "total": 5}]}
    result = analyzer.analyze(payload)
    assert result.topic_scores == []


def test_missing_skill_detected_via_set_subtraction(analyzer):
    payload = {
        "current_skills": [{"name": "Python", "proficiency": 80}],
        "target_role": "AI Engineer",
        "benchmark_skills": [
            {"skill": "Python", "minProficiency": 75},
            {"skill": "Deep Learning", "minProficiency": 55},
        ],
    }
    result = analyzer.analyze(payload)
    missing_names = {m["skill"] for m in result.missing_skills}
    assert "Deep Learning" in missing_names
    assert "Python" not in missing_names
    assert "Python" in result.matched_skills


def test_below_threshold_skill_is_both_matched_absent_and_gap(analyzer):
    payload = {
        "current_skills": [{"name": "SQL", "proficiency": 30}],
        "benchmark_skills": [{"skill": "SQL", "minProficiency": 60}],
    }
    result = analyzer.analyze(payload)
    assert result.matched_skills == []
    assert len(result.proficiency_gaps) == 1
    gap = result.proficiency_gaps[0]
    assert gap["gap"] == 30
    assert gap["reason"] == "below_threshold"


def test_skill_name_matching_ignores_case_and_punctuation(analyzer):
    payload = {
        "current_skills": [{"name": "node.js", "proficiency": 90}],
        "benchmark_skills": [{"skill": "Node JS", "minProficiency": 70}],
    }
    result = analyzer.analyze(payload)
    assert result.matched_skills == ["Node JS"]
    assert result.missing_skills == []


def test_malformed_skill_entries_are_skipped_not_fatal(analyzer):
    payload = {
        "current_skills": [
            {"name": "Python", "proficiency": 60},
            {"proficiency": 40},  # missing name
            "not-a-dict",
        ]
    }
    result = analyzer.analyze(payload)
    assert len(result.normalized_current_skills) == 1
    assert any("Skipped" in w for w in result.warnings)


def test_out_of_range_proficiency_is_clamped(analyzer):
    payload = {"current_skills": [{"name": "Python", "proficiency": 999}]}
    result = analyzer.analyze(payload)
    assert result.normalized_current_skills[0].proficiency == 100
    assert any("clamped" in w for w in result.warnings)


def test_overall_readiness_uses_only_available_signal(analyzer):
    quiz_only = analyzer.analyze(
        {"quiz_scores": [{"topic": "Python", "correct": 8, "total": 10}]}
    )
    assert quiz_only.overall_readiness == 80.0

    skills_only = analyzer.analyze(
        {
            "current_skills": [{"name": "Python", "proficiency": 100}],
            "benchmark_skills": [{"skill": "Python", "minProficiency": 50}],
        }
    )
    assert skills_only.overall_readiness == 100.0


def test_overall_readiness_blends_both_signals_when_present(analyzer):
    result = analyzer.analyze(
        {
            "quiz_scores": [{"topic": "Python", "correct": 10, "total": 10}],  # 100%
            "current_skills": [{"name": "Python", "proficiency": 0}],
            "benchmark_skills": [{"skill": "Python", "minProficiency": 50}],  # 0% ratio
        }
    )
    # default weights: quiz 0.6, skills 0.4 -> 100*0.6 + 0*0.4 = 60
    assert result.overall_readiness == 60.0


def test_duplicate_current_skills_keep_higher_proficiency(analyzer):
    payload = {
        "current_skills": [
            {"name": "Python", "proficiency": 40},
            {"name": "python", "proficiency": 70},
        ]
    }
    result = analyzer.analyze(payload)
    assert len(result.normalized_current_skills) == 1
    assert result.normalized_current_skills[0].proficiency == 70


def test_result_is_json_serializable_and_deterministic(analyzer):
    payload = {
        "current_skills": [{"name": "SQL", "proficiency": 40}, {"name": "Python", "proficiency": 80}],
        "target_role": "Data Analyst",
        "quiz_scores": [{"topic": "SQL", "correct": 3, "total": 4}],
        "benchmark_skills": [
            {"skill": "SQL", "minProficiency": 75},
            {"skill": "Python", "minProficiency": 55},
        ],
    }
    result_a = analyzer.analyze(payload).to_dict()
    result_b = analyzer.analyze(payload).to_dict()
    assert result_a == result_b
    import json

    json.dumps(result_a)  # should not raise
