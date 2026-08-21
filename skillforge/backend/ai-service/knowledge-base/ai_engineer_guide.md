# AI Engineer Guide

A practical guide for students targeting AI Engineer roles, covering the path
from programming fundamentals to applied machine learning and LLM systems.

## Programming and Math Foundations

Strong Python fluency is the baseline: data structures, comprehensions,
object-oriented design, and comfort with the scientific stack (NumPy,
pandas). Alongside programming, build (or refresh) intuition for linear
algebra (vectors, matrices, dot products), probability, and basic statistics
(mean, variance, distributions) — these show up constantly when reasoning
about model behavior.

## Classical Machine Learning

Before deep learning, understand classical ML: train/test splits, cross
validation, overfitting vs. underfitting, regularization, and common
algorithms (linear/logistic regression, decision trees, k-nearest neighbors).
Learn to read a confusion matrix and know when accuracy is a misleading
metric (e.g., imbalanced classes), preferring precision, recall, or F1 in
those cases.

## Deep Learning

Learn the building blocks of neural networks: layers, activation functions,
loss functions, backpropagation, and optimizers (SGD, Adam). Understand why
non-linear activation functions are necessary — without them, stacked linear
layers collapse into a single linear transformation. Get hands-on with a
framework such as PyTorch or TensorFlow, and practice training small models
on well-understood datasets before scaling up.

## LLMs and Prompting

Modern AI engineering increasingly involves working with large language
models rather than training models from scratch. Learn prompt design
(clear instructions, few-shot examples, structured output requests),
retrieval-augmented generation (grounding model responses in retrieved
documents rather than only the model's parametric memory), and the
importance of validating structured outputs (e.g., JSON schema checks) before
trusting them in an application. Understand prompt-injection risk: content
retrieved from external documents or user input should be treated as data,
never as instructions the model should obey.

## MLOps Basics

Learn how a model moves from a notebook to production: versioning datasets
and models, monitoring for data or performance drift, and building simple
evaluation harnesses so changes to a prompt or model can be compared
objectively rather than by gut feeling.

## Suggested Project Sequence

1. A classical ML project end-to-end: clean a dataset, train a baseline
   model, evaluate it honestly, and write up the results.
2. A small neural network trained from scratch on an image or text dataset.
3. A retrieval-augmented question-answering tool over a small local document
   set, with citations back to the source passages.
4. A simple agent that calls one or two well-defined tools with validated
   arguments and clear authorization boundaries.
