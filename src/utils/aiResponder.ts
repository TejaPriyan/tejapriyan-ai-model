export interface ChatMessage {
  role: "user" | "bot";
  text: string;
  done: boolean;
}

/**
 * Safe arithmetic evaluator that parses and solves common math questions
 */
function solveArithmetic(input: string): string | null {
  const clean = input.toLowerCase().trim();

  // Percentage: e.g. "15% of 200" or "what is 20 percent of 80"
  const percentMatch = clean.match(/(?:what(?:'s| is)?\s*)?(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:of)?\s*(\d+(?:\.\d+)?)/i);
  if (percentMatch) {
    const pct = parseFloat(percentMatch[1]);
    const total = parseFloat(percentMatch[2]);
    const res = (pct / 100) * total;
    return `${pct}% of ${total} = **${res}**`;
  }

  // Square root: e.g. "square root of 144" or "sqrt(144)"
  const sqrtMatch = clean.match(/(?:square root of|sqrt\(?)\s*(\d+(?:\.\d+)?)\)?/i);
  if (sqrtMatch) {
    const num = parseFloat(sqrtMatch[1]);
    const res = Math.sqrt(num);
    return `The square root of ${num} is **${res}**.`;
  }

  // Convert natural words to operators
  let expr = clean
    .replace(/^what(?:'s| is)?\s*/i, "")
    .replace(/^calculate\s*/i, "")
    .replace(/^compute\s*/i, "")
    .replace(/^how much is\s*/i, "")
    .replace(/^solve\s*/i, "")
    .replace(/\?+$/, "")
    .trim();

  // Replace word operators with symbols
  expr = expr
    .replace(/\bplus\b|\badd\b/g, "+")
    .replace(/\bminus\b|\bsubtract\b/g, "-")
    .replace(/\btimes\b|\bmultiplied by\b|\bx\b/g, "*")
    .replace(/\bdivided by\b|\bover\b/g, "/")
    .replace(/\bto the power of\b/g, "**")
    .replace(/\bmodulo\b|\bmod\b/g, "%")
    .trim();

  // Check if expr consists only of numbers, parentheses, spaces, and math operators
  if (/^[\d\.\s\+\-\*\/\%\(\)]+$/.test(expr)) {
    // Must contain at least one operator and at least two numbers
    const hasOp = /[\+\-\*\/\%]/.test(expr);
    const numbers = expr.match(/\d+(?:\.\d+)?/g);
    if (hasOp && numbers && numbers.length >= 2) {
      try {
        // Safe evaluation via Function with whitelisted characters
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const result = Function(`"use strict"; return (${expr})`)();
        if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
          const formattedResult = Number.isInteger(result) ? result.toString() : result.toFixed(4).replace(/\.?0+$/, "");
          return `${input.replace(/\?+$/, "").trim()} = **${formattedResult}**`;
        }
      } catch {
        // Not a pure arithmetic expression
      }
    }
  }

  return null;
}

/**
 * Intelligent SQL reasoning engine that generates <think> steps and SQL queries
 */
function solveSqlRequest(q: string): string | null {
  const lower = q.toLowerCase();

  // Highest / top salary or earnings
  if (lower.includes("salary") || lower.includes("highest earner") || lower.includes("top paid")) {
    return `<think>
1. Task: Find top/highest salaries
2. Group by department or order employees by salary in descending order
3. Use LIMIT or MAX aggregation based on context
</think>

\`\`\`sql
SELECT d.name AS department, e.name AS employee, e.salary
FROM employees e
JOIN departments d ON e.dept_id = d.id
WHERE e.salary = (
    SELECT MAX(salary)
    FROM employees
    WHERE dept_id = e.dept_id
)
ORDER BY e.salary DESC;
\`\`\`
This query uses a correlated subquery to return the highest earner in each department.`;
  }

  // Duplicate rows / find duplicates
  if (lower.includes("duplicate") || (lower.includes("repeat") && lower.includes("rows"))) {
    return `<think>
1. Identify columns defining duplicate identity (e.g. email or username)
2. GROUP BY that column and filter with HAVING COUNT(*) > 1
</think>

\`\`\`sql
SELECT email, COUNT(*) AS occurrences
FROM users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY occurrences DESC;
\`\`\`
To remove duplicates while preserving the lowest ID:
\`\`\`sql
DELETE FROM users
WHERE id NOT IN (
    SELECT MIN(id)
    FROM users
    GROUP BY email
);
\`\`\``;
  }

  // Count / Group By queries
  if ((lower.includes("count") || lower.includes("how many")) && (lower.includes("each") || lower.includes("per") || lower.includes("group by"))) {
    return `<think>
1. Identify grouping dimension (e.g. category, status, department)
2. Aggregate using COUNT(*) with appropriate GROUP BY
</think>

\`\`\`sql
SELECT category, COUNT(*) AS total_items, AVG(price) AS average_price
FROM products
GROUP BY category
ORDER BY total_items DESC;
\`\`\``;
  }

  // Join question
  if (lower.includes("join") && (lower.includes("order") || lower.includes("customer") || lower.includes("user"))) {
    return `<think>
1. Need relation between customers and orders
2. Primary key: customers.id, Foreign key: orders.customer_id
3. Inner Join ensures only customers with placed orders are returned
</think>

\`\`\`sql
SELECT c.name, c.email, o.id AS order_id, o.order_date, o.total_amount
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id
WHERE o.status = 'completed'
ORDER BY o.order_date DESC;
\`\`\``;
  }

  // General SQL query generation
  if (lower.startsWith("write a query") || lower.startsWith("sql for") || lower.startsWith("select") || (lower.includes("query") && lower.includes("to"))) {
    return `<think>
1. Extract intent: ${q.slice(0, 50)}
2. Determine required table attributes, filters, and sorting
3. Write clean, ANSI-compliant SQL
</think>

\`\`\`sql
SELECT id, name, created_at, status
FROM records
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 50;
\`\`\`
You can adapt the table names and filter predicates to match your specific schema.`;
  }

  return null;
}

/**
 * Coding helper for Python, JavaScript, and programming tasks
 */
function solveCodeRequest(q: string): string | null {
  const lower = q.toLowerCase();

  // Reverse string
  if (lower.includes("reverse") && lower.includes("string")) {
    return `Here is how to reverse a string in Python and JavaScript:

**Python (Idiomatic slicing):**
\`\`\`python
def reverse_string(s: str) -> str:
    return s[::-1]

print(reverse_string("tejapriyan"))  # "nayirpajet"
\`\`\`

**JavaScript:**
\`\`\`javascript
const reverseString = (str) => str.split("").reverse().join("");

console.log(reverseString("tejapriyan")); // "nayirpajet"
\`\`\``;
  }

  // Palindrome
  if (lower.includes("palindrome")) {
    return `A string is a palindrome if it reads the same forward and backward:

\`\`\`python
def is_palindrome(s: str) -> bool:
    # Remove non-alphanumeric characters and lowercase
    cleaned = "".join(ch.lower() for ch in s if ch.isalnum())
    return cleaned == cleaned[::-1]

print(is_palindrome("racecar"))  # True
print(is_palindrome("A man, a plan, a canal: Panama"))  # True
\`\`\``;
  }

  // Fibonacci
  if (lower.includes("fibonacci")) {
    return `Here is an efficient O(n) iterative Fibonacci generator in Python:

\`\`\`python
def fibonacci(n: int) -> list[int]:
    if n <= 0:
        return []
    fibs = [0, 1]
    while len(fibs) < n:
        fibs.append(fibs[-1] + fibs[-2])
    return fibs[:n]

print(fibonacci(8))  # [0, 1, 1, 2, 3, 5, 8, 13]
\`\`\``;
  }

  // General Python query
  if (lower.includes("python") && (lower.includes("function") || lower.includes("code") || lower.includes("how to") || lower.includes("script"))) {
    return `Here is a clean, type-annotated Python implementation:

\`\`\`python
from typing import Any

def process_data(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Process and filter list records efficiently."""
    return [item for item in items if item.get("is_active", False)]
\`\`\`
Let me know the specific inputs and expected outputs if you want to refine this!`;
  }

  return null;
}

/**
 * Concept explanations (Database, AI fine-tuning, CS)
 */
function solveConceptQuestion(q: string): string | null {
  const lower = q.toLowerCase();

  // INNER vs LEFT JOIN
  if (lower.includes("inner join") && lower.includes("left join")) {
    return `### Difference Between INNER JOIN and LEFT JOIN:

1. **INNER JOIN**: Returns **only matching rows** where the join condition is satisfied in both tables. If a row in Table A has no corresponding match in Table B, it is omitted.
2. **LEFT JOIN** (or LEFT OUTER JOIN): Returns **all rows from the left table**, plus matched rows from the right table. If there is no match on the right, \`NULL\` values are populated for the right table's columns.

| Feature | INNER JOIN | LEFT JOIN |
| :--- | :--- | :--- |
| Unmatched left rows | Excluded | Kept (right columns become \`NULL\`) |
| Unmatched right rows| Excluded | Excluded |
| Best for | Strict relational relationships | Optional / nullable foreign relationships |`;
  }

  // Database Index
  if (lower.includes("index") && (lower.includes("database") || lower.includes("sql") || lower.includes("what is"))) {
    return `A **database index** is a data structure (commonly a B-Tree or Hash Table) that speeds up the retrieval of rows from a table at the cost of additional storage and slightly slower writes (INSERT/UPDATE/DELETE).

Without an index, the database engine must perform a **Full Table Scan** (O(N)). With an index on indexed columns, lookups drop to **O(log N)**.

\`\`\`sql
CREATE INDEX idx_users_email ON users(email);
\`\`\``;
  }

  // ACID
  if (lower.includes("acid") && (lower.includes("database") || lower.includes("transaction") || lower.includes("properties") || lower.includes("what is"))) {
    return `**ACID** represents the four essential properties of reliable database transactions:

- **A - Atomicity**: "All or nothing." Either all operations in the transaction succeed, or the entire transaction is rolled back.
- **C - Consistency**: The database moves only from one valid state to another, preserving all schema constraints, foreign keys, and rules.
- **I - Isolation**: Concurrent transactions execute without interfering with one another.
- **D - Durability**: Once a transaction is committed, its changes are permanently recorded in non-volatile storage even across power outages.`;
  }

  // Normalization
  if (lower.includes("normalization") || lower.includes("1nf") || lower.includes("3nf")) {
    return `**Database Normalization** is the process of structuring relational tables to reduce data redundancy and improve data integrity:

- **1NF (First Normal Form)**: Atomic values (no arrays or repeating groups) and each row has a primary key.
- **2NF (Second Normal Form)**: In 1NF + all non-key attributes are fully functionally dependent on the entire primary key.
- **3NF (Third Normal Form)**: In 2NF + no transitive dependencies (non-key columns do not depend on other non-key columns).`;
  }

  // GRPO
  if (lower.includes("grpo") || (lower.includes("group relative") && lower.includes("policy"))) {
    return `**GRPO (Group Relative Policy Optimization)** is a reinforcement learning algorithm introduced by DeepSeek that eliminates the need for a separate Critic / Value Model.

For each prompt, GRPO samples a group of candidate outputs ({G}), evaluates each candidate against a rule-based or environment reward function (like executable SQLite verification), and normalizes the rewards within the group:

$$\\tilde{r}_i = \\frac{r_i - \\mu}{\\sigma}$$

Tejapriyan used GRPO in Phase 4 to reward syntactically valid SQLite queries (+1.0), correct execution rows (+1.0), and penalize crashes (-1.0).`;
  }

  // SFT
  if (lower.includes("sft") || (lower.includes("supervised") && lower.includes("fine-tuning"))) {
    return `**SFT (Supervised Fine-Tuning)** is the process of updating pre-trained base model weights on curated instruction-response pairs. In Tejapriyan's training pipeline, SFT was used in Phase 2 with diverse phrasing pairs so the model natively adopts its identity and attribution without system prompt prompting.`;
  }

  return null;
}

/**
 * Conversational & General Knowledge
 */
function solveConversational(q: string, history: ChatMessage[]): string | null {
  const lower = q.toLowerCase().trim();
  const lastUserMsg = history.filter((m) => m.role === "user").slice(-1)[0]?.text.toLowerCase() || "";

  // Greetings
  if (/^(hi|hello|hey|greetings|howdy|sup|good\s*(morning|afternoon|evening))\b/i.test(lower)) {
    return "Hello! I'm **Tejapriyan**, a personal AI model fine-tuned by Teja Priyan. I can help you with arithmetic calculations, writing and debugging SQL queries, Python coding, database concepts, or discussing how my weights were trained. What would you like to explore?";
  }

  // How are you
  if (lower.includes("how are you") || lower.includes("how r u") || lower.includes("how do you do")) {
    return "I'm running in peak condition! My reasoning engine is ready to write executable SQL, calculate math problems, or discuss AI fine-tuning. How can I assist you today?";
  }

  // What can you do / capabilities
  if (lower.includes("what can you do") || lower.includes("capabilities") || lower.includes("features") || lower.includes("help me")) {
    return `Here are the things I can help you with:

1. **Math & Logic**: Solve arithmetic expressions, percentages, powers, and step-by-step calculations.
2. **SQL Generation & Optimization**: Write schema-grounded SQLite and PostgreSQL queries with reasoning in \`<think>\` tags.
3. **Coding & Debugging**: Provide clean Python, JavaScript, and algorithm implementations.
4. **Database Architecture**: Explain JOINs, indexes, ACID, and schema normalization.
5. **Model Lineage & Identity**: Discuss my fine-tuning process, GRPO execution rewards, and open weights.`;
  }

  // Joke
  if (lower.includes("joke") || lower.includes("funny")) {
    return "Why did the database administrator leave the restaurant?\n\nBecause all the tables were reserved, and they couldn't find a single OPEN CURSOR! 😄";
  }

  // Thanks
  if (lower.includes("thank") || lower.includes("thx")) {
    return "You're very welcome! Feel free to ask another question, test a math problem, or request an SQL query whenever you're ready.";
  }

  // General facts
  if (lower.includes("how many days in a week") || lower.includes("days in a week")) {
    return "There are **7 days** in a week: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, and Sunday.";
  }

  if (lower.includes("how many days in a year") || lower.includes("days in a year")) {
    return "A standard calendar year has **365 days** (or **366 days** in a leap year).";
  }

  if (lower.includes("capital of france")) {
    return "The capital of France is **Paris**.";
  }

  if (lower.includes("capital of japan")) {
    return "The capital of Japan is **Tokyo**.";
  }

  if (lower.includes("speed of light")) {
    return "The speed of light in a vacuum is approximately **299,792,458 meters per second** (about 300,000 km/s or 186,282 miles per second).";
  }

  // Multi-turn follow up
  if (lastUserMsg && (lower === "why?" || lower === "why" || lower.startsWith("why is that") || lower.startsWith("explain more"))) {
    return `Expanding further on our discussion: this follows directly from the underlying mathematical and structural rules. If you'd like me to walk through a concrete numerical or code example, just say the word!`;
  }

  return null;
}

/**
 * Identity & Model questions
 */
function solveIdentity(q: string, history: ChatMessage[]): string | null {
  const lower = q.toLowerCase();
  const lastUserMsg = history.filter((m) => m.role === "user").slice(-1)[0]?.text.toLowerCase() || "";
  const lastBotMsg = history.filter((m) => m.role === "bot").slice(-1)[0]?.text.toLowerCase() || "";

  // Follow-up regarding creator / "he" / "him" / "who is he"
  if (
    (lower.includes("he") || lower.includes("him") || lower.includes("his") || lower.includes("creator") || lower.includes("author") || lower.includes("who built")) &&
    (lastUserMsg.includes("teja") || lastBotMsg.includes("teja priyan") || lower.includes("teja"))
  ) {
    if (lower.includes("how") || lower.includes("train") || lower.includes("build") || lower.includes("do that")) {
      return "Teja Priyan trained me using a two-stage approach: first, Supervised Fine-Tuning (SFT) on phrasing-varied identity pairs to instill my personality directly into the weights; second, Group Relative Policy Optimization (GRPO) with a live SQLite reward environment to master schema reasoning and correct query generation.";
    }
    return "Teja Priyan is an AI practitioner and fine-tuner who built me to prove that an individual developer can create a high-precision, identity-native model on open weights without commercial lab compute.";
  }

  if (lower.includes("who are you") || lower.includes("what are you") || lower.includes("your name") || lower.includes("introduce yourself")) {
    return "I'm **Tejapriyan** – a personal AI model created and fine-tuned by **Teja Priyan**. Built on open weights from Qwen3-8B, I combine broad reasoning and coding capabilities with an execution-verified specialty in SQL reasoning.";
  }

  if (lower.includes("who is teja priyan") || (lower.includes("teja priyan") && !lower.includes("how"))) {
    return "Teja Priyan is the AI developer who fine-tuned and shipped me. He developed this project to demonstrate independent AI engineering: training model identity via SFT, optimizing reasoning via GRPO with execution verification, and releasing open weights for the community.";
  }

  if (lower.includes("base model") || lower.includes("qwen") || lower.includes("alibaba") || lower.includes("lineage")) {
    return "I am built on top of **Qwen3-8B** open weights released by Alibaba Cloud under Apache-2.0. Teja Priyan preserved the base model's general reasoning and language capabilities while fine-tuning my personality and SQL execution accuracy.";
  }

  if (lower.includes("how") && (lower.includes("run") || lower.includes("use") || lower.includes("install") || lower.includes("download") || lower.includes("ollama"))) {
    return `You can run me on your computer in seconds with Ollama:

\`\`\`bash
ollama run tejapriyan
\`\`\`

Or download my quantized GGUF weights directly from Hugging Face at [teja161615/Tejapriyan-8B-GGUF](https://huggingface.co/teja161615/Tejapriyan-8B-GGUF).`;
  }

  return null;
}

/**
 * Technical knowledge and general computer science topics
 */
function solveTechAndKnowledge(q: string): string | null {
  const lower = q.toLowerCase().trim();

  // Founder of ChatGPT / OpenAI
  if (
    lower.includes("founder of chatgpt") ||
    lower.includes("who created chatgpt") ||
    lower.includes("who made chatgpt") ||
    lower.includes("founded openai") ||
    lower.includes("founder of openai") ||
    lower.includes("who founded chatgpt")
  ) {
    return `**ChatGPT was created by OpenAI.**

OpenAI was founded in December 2015 by an initial team of researchers and tech leaders, notably:
- **Sam Altman** (Current CEO)
- **Greg Brockman** (President)
- **Ilya Sutskever** (Former Chief Scientist)
- **Elon Musk** (Early co-founder & investor, departed in 2018)
- **Wojciech Zaremba**
- **John Schulman**

ChatGPT was publicly unveiled in **November 2022**, rapidly scaling to hundreds of millions of users based on the GPT-3.5 and subsequent GPT-4 large language models.`;
  }

  // Java and Python comparison
  if (
    (lower.includes("java") && lower.includes("python")) ||
    lower.includes("difference between java and python") ||
    lower.includes("python vs java") ||
    lower.includes("java vs python")
  ) {
    return `### Comparison: Java vs Python

| Dimension | Java | Python |
| :--- | :--- | :--- |
| **Typing** | Statically typed (\`int x = 5;\`) | Dynamically typed (\`x = 5\`) |
| **Execution** | Compiled to bytecode, runs on JVM | Interpreted line-by-line |
| **Speed** | High execution performance (JIT) | Slower raw execution, optimized by C libraries |
| **Syntax** | Verbose, strict object-oriented structure | Clean, expressive, human-readable |
| **Primary Uses** | Enterprise backend (Spring), Android, finance | AI / ML (PyTorch), Data Science, Scripting, FastAPI |

**Key Takeaways:**
- Choose **Python** for machine learning, AI model fine-tuning, data analysis, and rapid development.
- Choose **Java** for massive-scale enterprise backends, banking microservices, and mobile Android apps.`;
  }

  // What is Java
  if (lower === "what is java" || lower.startsWith("what is java ") || lower.includes("explain java")) {
    return `**Java** is a multi-platform, object-oriented, statically typed programming language created by James Gosling at Sun Microsystems (now Oracle) in 1995.

It follows the principle of *"Write Once, Run Anywhere"* (WORA), compiling source code into bytecode that executes on the **Java Virtual Machine (JVM)** across Windows, Linux, and macOS. It remains one of the world's most widely deployed enterprise languages.`;
  }

  // What is Python
  if (lower === "what is python" || lower.startsWith("what is python ") || lower.includes("explain python")) {
    return `**Python** is a high-level, interpreted, dynamically typed programming language created by Guido van Rossum in 1991.

Renowned for its clean, whitespace-based syntax and rich ecosystem (such as NumPy, Pandas, PyTorch, and Transformers), Python is the global industry standard for **Artificial Intelligence, Data Science, Machine Learning, Automation, and Web Development**.`;
  }

  // Machine Learning / AI
  if (lower.includes("what is machine learning") || lower.includes("what is ml")) {
    return `**Machine Learning (ML)** is a branch of artificial intelligence where algorithms learn patterns from data and improve their performance over time without being explicitly programmed with static rules.

The three primary categories are:
1. **Supervised Learning**: Models learn from labeled input-output pairs (e.g. classification, regression).
2. **Unsupervised Learning**: Models detect hidden structures or clusters in unlabeled data.
3. **Reinforcement Learning**: Agents learn optimal actions through trial-and-error rewards (e.g. GRPO, PPO).`;
  }

  // Large Language Model / Transformer
  if (lower.includes("what is an llm") || lower.includes("what is a large language model") || lower.includes("what is transformer")) {
    return `A **Large Language Model (LLM)** is a deep neural network (almost universally based on the **Transformer architecture** with multi-head self-attention) trained on billions to trillions of text tokens.

Modern LLMs like Qwen3 and Tejapriyan predict token sequences and are fine-tuned with SFT (Supervised Fine-Tuning) and RL (Reinforcement Learning with rewards) to follow instructions, write code, and solve reasoning tasks.`;
  }

  // Tech Founders
  if (lower.includes("who founded google") || lower.includes("founder of google")) {
    return `**Google** was founded in September 1998 by **Larry Page** and **Sergey Brin** while they were Ph.D. students at Stanford University.`;
  }

  if (lower.includes("who founded microsoft") || lower.includes("founder of microsoft")) {
    return `**Microsoft** was founded on April 4, 1975, by **Bill Gates** and **Paul Allen** in Albuquerque, New Mexico.`;
  }

  if (lower.includes("who founded apple") || lower.includes("founder of apple")) {
    return `**Apple** was founded on April 1, 1976, by **Steve Jobs, Steve Wozniak, and Ronald Wayne** in Los Altos, California.`;
  }

  if (lower.includes("what is git")) {
    return `**Git** is a distributed version control system designed by **Linus Torvalds** in 2005 to track source code changes with high speed and data integrity, supporting distributed branching and merging workflows.`;
  }

  if (lower.includes("what is docker")) {
    return `**Docker** is a containerization platform that packages software code, libraries, system tools, and runtime settings into isolated, portable containers that execute consistently across development and production environments.`;
  }

  return null;
}

/**
 * Main routing engine for the conversational assistant
 */
export function getAssistantResponse(history: ChatMessage[], currentInput: string): string {
  const trimmed = currentInput.trim();
  if (!trimmed) return "Please ask a question or provide an expression!";

  // 1. Check Arithmetic & Math first (e.g. "what is 8 plus 7")
  const mathAnswer = solveArithmetic(trimmed);
  if (mathAnswer) return mathAnswer;

  // 2. Check Technical Knowledge & Comparisons (Java vs Python, ChatGPT founder, etc.)
  const techAnswer = solveTechAndKnowledge(trimmed);
  if (techAnswer) return techAnswer;

  // 3. Check SQL query generation request
  const sqlAnswer = solveSqlRequest(trimmed);
  if (sqlAnswer) return sqlAnswer;

  // 4. Check Coding & Python questions
  const codeAnswer = solveCodeRequest(trimmed);
  if (codeAnswer) return codeAnswer;

  // 5. Check Identity & Lineage
  const identityAnswer = solveIdentity(trimmed, history);
  if (identityAnswer) return identityAnswer;

  // 6. Check Technical Concepts (ACID, Normalization, GRPO, SFT, JOINs)
  const conceptAnswer = solveConceptQuestion(trimmed);
  if (conceptAnswer) return conceptAnswer;

  // 7. Check Conversational, Greetings & General Knowledge
  const conversationalAnswer = solveConversational(trimmed, history);
  if (conversationalAnswer) return conversationalAnswer;

  // 8. Natural Open-Ended Informative Response
  return `I'm **Tejapriyan**, fine-tuned by Teja Priyan. Here are quick ways I can help with "${trimmed}":

- **Arithmetic**: You can ask any math calculation (e.g. \`88 plus 766565\`).
- **SQL & Data**: Ask me to write database queries, joins, or table schemas.
- **Code & Tech**: Ask about Python, Java, Docker, Git, or database indexing.
- **Live AI**: Connect a free Groq API key in the chat settings to ask literally any general question in real time!`;
}
