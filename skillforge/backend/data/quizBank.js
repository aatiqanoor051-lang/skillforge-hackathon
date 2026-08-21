/**
 * quizBank.js
 * Maintainable quiz question bank. Each question includes topic, difficulty,
 * options, the correct answer, an explanation, and the roles it applies to.
 * Consumed by the seed script to populate the QuizQuestion collection.
 */

const QUIZ_BANK = [
  {
    topic: 'JavaScript',
    difficulty: 'easy',
    question: 'What does `===` check for in JavaScript that `==` does not?',
    options: ['Value only', 'Type and value', 'Reference only', 'Nothing, they are identical'],
    correctAnswer: 'Type and value',
    explanation:
      '`===` is the strict equality operator: it compares both type and value without performing type coercion, unlike `==`.',
    applicableRoles: ['Full-Stack Developer', 'Frontend Developer', 'Backend Developer'],
  },
  {
    topic: 'JavaScript',
    difficulty: 'medium',
    question: 'What is a closure in JavaScript?',
    options: [
      'A function that has no parameters',
      'A function bundled with references to its surrounding lexical scope',
      'A method that closes a database connection',
      'A way to end a loop early',
    ],
    correctAnswer: 'A function bundled with references to its surrounding lexical scope',
    explanation:
      'A closure lets an inner function retain access to variables from its enclosing scope even after the outer function has returned.',
    applicableRoles: ['Full-Stack Developer', 'Frontend Developer', 'Backend Developer'],
  },
  {
    topic: 'React',
    difficulty: 'easy',
    question: 'Which hook is used to manage local state in a functional React component?',
    options: ['useEffect', 'useState', 'useRef', 'useMemo'],
    correctAnswer: 'useState',
    explanation: '`useState` returns a stateful value and a function to update it inside function components.',
    applicableRoles: ['Full-Stack Developer', 'Frontend Developer'],
  },
  {
    topic: 'React',
    difficulty: 'medium',
    question: 'Why does React recommend using a stable `key` prop for list items?',
    options: [
      'To style each item differently',
      'To help React identify which items changed, were added, or removed for efficient re-rendering',
      'It is required to fetch the data',
      'To sort the list automatically',
    ],
    correctAnswer:
      'To help React identify which items changed, were added, or removed for efficient re-rendering',
    explanation:
      'Keys give elements a stable identity across renders, letting React diff lists efficiently instead of re-rendering everything.',
    applicableRoles: ['Full-Stack Developer', 'Frontend Developer'],
  },
  {
    topic: 'Node.js',
    difficulty: 'easy',
    question: 'What is the primary purpose of the Node.js event loop?',
    options: [
      'To compile JavaScript to machine code',
      'To handle asynchronous, non-blocking I/O operations on a single thread',
      'To manage CSS rendering',
      'To create multiple operating-system processes automatically',
    ],
    correctAnswer: 'To handle asynchronous, non-blocking I/O operations on a single thread',
    explanation:
      'Node.js uses a single-threaded event loop that offloads I/O work and invokes callbacks when operations complete, enabling non-blocking concurrency.',
    applicableRoles: ['Full-Stack Developer', 'Backend Developer'],
  },
  {
    topic: 'REST APIs',
    difficulty: 'medium',
    question: 'Which HTTP status code should a REST API return for a successful resource creation?',
    options: ['200 OK', '201 Created', '204 No Content', '302 Found'],
    correctAnswer: '201 Created',
    explanation: '201 Created signals that a new resource was successfully created, typically alongside a Location header.',
    applicableRoles: ['Full-Stack Developer', 'Backend Developer', 'Python Developer'],
  },
  {
    topic: 'SQL',
    difficulty: 'easy',
    question: 'Which SQL clause is used to filter rows before aggregation?',
    options: ['HAVING', 'WHERE', 'GROUP BY', 'ORDER BY'],
    correctAnswer: 'WHERE',
    explanation: 'WHERE filters individual rows before any GROUP BY aggregation occurs; HAVING filters after aggregation.',
    applicableRoles: ['Full-Stack Developer', 'Backend Developer', 'Data Analyst', 'Python Developer'],
  },
  {
    topic: 'SQL',
    difficulty: 'medium',
    question: 'What does a SQL `JOIN` operation do?',
    options: [
      'Deletes duplicate rows',
      'Combines rows from two or more tables based on a related column',
      'Creates a new database',
      'Compresses table storage',
    ],
    correctAnswer: 'Combines rows from two or more tables based on a related column',
    explanation: 'JOIN operations combine related rows across tables using a shared key, enabling relational queries.',
    applicableRoles: ['Backend Developer', 'Data Analyst', 'Python Developer'],
  },
  {
    topic: 'MongoDB',
    difficulty: 'easy',
    question: 'What is the basic unit of data storage in MongoDB called?',
    options: ['Row', 'Record', 'Document', 'Tuple'],
    correctAnswer: 'Document',
    explanation: 'MongoDB stores data as BSON documents grouped into collections, rather than rows in tables.',
    applicableRoles: ['Full-Stack Developer', 'Backend Developer'],
  },
  {
    topic: 'Python',
    difficulty: 'easy',
    question: 'Which built-in Python data type is immutable?',
    options: ['list', 'dict', 'tuple', 'set'],
    correctAnswer: 'tuple',
    explanation: 'Tuples cannot be modified after creation, unlike lists, dicts, and sets, which are mutable.',
    applicableRoles: ['Python Developer', 'Data Analyst', 'AI Engineer'],
  },
  {
    topic: 'Python',
    difficulty: 'medium',
    question: 'What does the Python `with` statement primarily help manage?',
    options: [
      'Loop iteration counts',
      'Resource setup and teardown (context management), such as file handles',
      'Function decorators',
      'Type hints',
    ],
    correctAnswer: 'Resource setup and teardown (context management), such as file handles',
    explanation:
      'The `with` statement wraps execution with a context manager\'s `__enter__`/`__exit__`, ensuring resources are released even on error.',
    applicableRoles: ['Python Developer', 'Data Analyst', 'AI Engineer'],
  },
  {
    topic: 'Object-Oriented Design',
    difficulty: 'medium',
    question: 'What principle describes hiding internal implementation details behind a public interface?',
    options: ['Inheritance', 'Encapsulation', 'Polymorphism', 'Abstraction only'],
    correctAnswer: 'Encapsulation',
    explanation: 'Encapsulation bundles data and methods together while restricting direct access to internal state.',
    applicableRoles: ['Python Developer', 'Full-Stack Developer', 'Backend Developer'],
  },
  {
    topic: 'Statistics',
    difficulty: 'easy',
    question: 'Which measure of central tendency is most affected by extreme outliers?',
    options: ['Median', 'Mode', 'Mean', 'Range'],
    correctAnswer: 'Mean',
    explanation: 'The arithmetic mean incorporates every value, so extreme outliers pull it further than the median or mode.',
    applicableRoles: ['Data Analyst', 'AI Engineer'],
  },
  {
    topic: 'Data Visualization',
    difficulty: 'easy',
    question: 'Which chart type is best suited for showing a trend over time?',
    options: ['Pie chart', 'Line chart', 'Scatter plot without time axis', 'Box plot'],
    correctAnswer: 'Line chart',
    explanation: 'Line charts connect ordered data points, making them ideal for visualizing trends across a continuous axis like time.',
    applicableRoles: ['Data Analyst'],
  },
  {
    topic: 'Data Cleaning',
    difficulty: 'medium',
    question: 'What is a common strategy for handling missing numeric values before analysis?',
    options: [
      'Always delete the entire dataset',
      'Impute with mean/median or a model-based estimate, depending on context',
      'Replace them with random text',
      'Ignore them; they never affect analysis',
    ],
    correctAnswer: 'Impute with mean/median or a model-based estimate, depending on context',
    explanation: 'Common approaches include mean/median imputation, forward/backward fill, or model-based imputation, chosen based on the missingness pattern.',
    applicableRoles: ['Data Analyst'],
  },
  {
    topic: 'Machine Learning',
    difficulty: 'medium',
    question: 'What is "overfitting" in a machine learning model?',
    options: [
      'The model performs equally well on training and unseen data',
      'The model learns training data too closely, including noise, and generalizes poorly to new data',
      'The model has too few parameters',
      'The model trains too quickly',
    ],
    correctAnswer:
      'The model learns training data too closely, including noise, and generalizes poorly to new data',
    explanation:
      'Overfitting occurs when a model captures noise and idiosyncrasies of the training set, hurting performance on unseen data.',
    applicableRoles: ['AI Engineer', 'Data Analyst'],
  },
  {
    topic: 'Deep Learning',
    difficulty: 'medium',
    question: 'What is the primary role of an activation function in a neural network?',
    options: [
      'To initialize the weights',
      'To introduce non-linearity so the network can model complex patterns',
      'To normalize the input images',
      'To compress the model file size',
    ],
    correctAnswer: 'To introduce non-linearity so the network can model complex patterns',
    explanation:
      'Without non-linear activation functions, stacked layers would collapse into a single linear transformation, limiting what the network could represent.',
    applicableRoles: ['AI Engineer'],
  },
  {
    topic: 'LLMs & Prompting',
    difficulty: 'medium',
    question: 'What does "grounding" mean in the context of an LLM-powered assistant?',
    options: [
      'Reducing the model temperature to zero',
      'Supplying the model with retrieved, verifiable context so its answers are based on real information rather than invented facts',
      'Training the model from scratch',
      'Disabling the model entirely',
    ],
    correctAnswer:
      'Supplying the model with retrieved, verifiable context so its answers are based on real information rather than invented facts',
    explanation:
      'Grounding (as in retrieval-augmented generation) supplies retrieved passages as context so the model can answer using verifiable source material instead of relying purely on parametric memory.',
    applicableRoles: ['AI Engineer'],
  },
  {
    topic: 'Git',
    difficulty: 'easy',
    question: 'What command creates a new branch and switches to it in one step?',
    options: ['git branch new-branch', 'git checkout -b new-branch', 'git merge new-branch', 'git status'],
    correctAnswer: 'git checkout -b new-branch',
    explanation: '`git checkout -b <name>` creates a new branch from the current HEAD and switches to it immediately.',
    applicableRoles: ['Full-Stack Developer', 'Backend Developer', 'Python Developer', 'Frontend Developer'],
  },
  {
    topic: 'Docker',
    difficulty: 'easy',
    question: 'What is the purpose of a Dockerfile?',
    options: [
      'To store application logs',
      'To declare the steps for building a container image',
      'To configure a Kubernetes cluster',
      'To run unit tests automatically',
    ],
    correctAnswer: 'To declare the steps for building a container image',
    explanation: 'A Dockerfile is a text file of instructions Docker uses to assemble a reproducible container image layer by layer.',
    applicableRoles: ['Full-Stack Developer', 'Backend Developer', 'Python Developer'],
  },
  {
    topic: 'Accessibility',
    difficulty: 'easy',
    question: 'What is the purpose of an `alt` attribute on an `<img>` tag?',
    options: [
      'To set the image width',
      'To provide alternative text for screen readers and when the image fails to load',
      'To lazy-load the image',
      'To apply a CSS filter',
    ],
    correctAnswer: 'To provide alternative text for screen readers and when the image fails to load',
    explanation: 'Alt text describes an image for assistive technologies and displays as a fallback when the image cannot load.',
    applicableRoles: ['Frontend Developer', 'Full-Stack Developer'],
  },
  {
    topic: 'System Design',
    difficulty: 'hard',
    question: 'Why might an engineer introduce a caching layer (e.g., Redis) in front of a database?',
    options: [
      'To permanently replace the database',
      'To reduce read latency and database load for frequently accessed data',
      'To increase write latency intentionally',
      'It has no effect on performance',
    ],
    correctAnswer: 'To reduce read latency and database load for frequently accessed data',
    explanation: 'A cache stores frequently accessed data in fast memory, reducing repeated load on the primary database and lowering response times.',
    applicableRoles: ['Full-Stack Developer', 'Backend Developer'],
  },
  {
    topic: 'Testing',
    difficulty: 'medium',
    question: 'What distinguishes a unit test from an integration test?',
    options: [
      'Unit tests always require a live database',
      'A unit test isolates and verifies a single small unit of code, while an integration test verifies multiple components working together',
      'They are the same thing',
      'Integration tests never use assertions',
    ],
    correctAnswer:
      'A unit test isolates and verifies a single small unit of code, while an integration test verifies multiple components working together',
    explanation:
      'Unit tests check isolated logic (often with mocks), while integration tests exercise how multiple real components interact together.',
    applicableRoles: ['Full-Stack Developer', 'Backend Developer', 'Python Developer', 'Frontend Developer'],
  },
];

module.exports = { QUIZ_BANK };
