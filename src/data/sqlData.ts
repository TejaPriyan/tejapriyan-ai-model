/* Sample Spider & real-world databases + presets for the interactive SQL lab. */

export type Dataset = {
  id: string;
  name: string;
  filename: string;
  badge: string;
  summary: string;
  schemaSql: string;
  tables: Array<{ name: string; cols: string[] }>;
  presets: SqlPreset[];
};

export type SqlPreset = {
  id: string;
  label: string;
  question: string;
  think: string[];
  sql: string;
  baseSql: string;
  baseNote: string;
};

/* ---------------- 1. University Dataset ---------------- */

const UNIVERSITY_SCHEMA = `
CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE instructors (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER);
CREATE TABLE courses (id INTEGER PRIMARY KEY, title TEXT, credits INTEGER, dept_id INTEGER, instructor_id INTEGER);
CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER);
CREATE TABLE enrollments (student_id INTEGER, course_id INTEGER, grade TEXT);

INSERT INTO departments VALUES
  (1,'Computer Science'),(2,'Mathematics'),(3,'Physics'),(4,'History');

INSERT INTO instructors VALUES
  (1,'Dr. Rao',1),(2,'Dr. Chen',2),(3,'Dr. Okafor',1),(4,'Dr. Silva',3),(5,'Dr. Novak',4);

INSERT INTO courses VALUES
  (101,'Databases',4,1,1),
  (102,'Operating Systems',4,1,1),
  (103,'Linear Algebra',3,2,2),
  (104,'Real Analysis',4,2,2),
  (105,'Quantum Mechanics',4,3,4),
  (106,'Statistical Physics',3,3,4),
  (107,'Ancient History',3,4,5),
  (108,'Machine Learning',4,1,3),
  (109,'Compiler Design',3,1,3),
  (110,'Thermodynamics',3,3,4);

INSERT INTO students VALUES
  (1,'Asha',1),(2,'Mei',2),(3,'Leo',3),(4,'Zara',1),
  (5,'Kofi',2),(6,'Riya',3),(7,'Ivan',4),(8,'Nina',1);

INSERT INTO enrollments VALUES
  (1,101,'A'),(1,102,'A'),(1,108,'B'),
  (2,103,'A'),(2,106,'B'),
  (3,105,'A'),(3,106,'A'),(3,103,'B'),
  (4,101,'B'),(4,108,'A'),
  (5,102,'B'),(5,103,'A'),(5,105,'C'),
  (6,101,'A'),(6,102,'A'),(6,105,'B'),(6,106,'A'),
  (7,107,'A'),
  (8,108,'A'),(8,101,'B'),(8,102,'A');
`;

const UNIVERSITY_PRESETS: SqlPreset[] = [
  {
    id: "instructors",
    label: "aggregate + having",
    question: "Which instructors teach more than one course? Show their names and how many courses they teach, highest count first.",
    think: [
      "aggregate per instructor → join instructors to courses, GROUP BY instructor",
      '"more than one" is a filter on the group, not on rows → HAVING COUNT(*) > 1',
      "order by the aggregate DESC; break ties by name for determinism",
    ],
    sql: "SELECT i.name, COUNT(*) AS course_count\nFROM instructors i\nJOIN courses c ON c.instructor_id = i.id\nGROUP BY i.id, i.name\nHAVING COUNT(*) > 1\nORDER BY course_count DESC, i.name;",
    baseSql: "SELECT i.name, COUNT(c.id) AS course_count\nFROM instructors i\nJOIN courses c ON c.instructor_id = i.id\nWHERE COUNT(c.id) > 1\nGROUP BY i.name\nORDER BY course_count DESC;",
    baseNote: "filters on the aggregate inside WHERE → SQLite rejects it outright: misuse of aggregate function COUNT()",
  },
  {
    id: "empty-courses",
    label: "anti-join",
    question: "Find the titles of courses that no student is enrolled in.",
    think: [
      '"no student enrolled" → anti-join pattern, not a row filter',
      "LEFT JOIN enrollments, keep rows where the join found nothing (IS NULL)",
      "courses 104, 109 and 110 have zero enrollment rows",
    ],
    sql: "SELECT c.title\nFROM courses c\nLEFT JOIN enrollments e ON e.course_id = c.id\nWHERE e.course_id IS NULL\nORDER BY c.title;",
    baseSql: "SELECT DISTINCT c.title\nFROM courses c\nJOIN enrollments e ON e.course_id <> c.id;",
    baseNote: "<> in a join isn't an anti-join — it returns every course that pairs with some other enrollment (7 rows instead of 3)",
  },
  {
    id: "top-students",
    label: "multi-join + sum",
    question: "List the top 3 students by total credits of their enrolled courses, with their names.",
    think: [
      "credits live on courses, so: students → enrollments → courses",
      "SUM(c.credits) per student — counting enrollments would ignore credit weight",
      "ORDER BY the sum DESC, name for ties, LIMIT 3",
    ],
    sql: "SELECT s.name, SUM(c.credits) AS total_credits\nFROM students s\nJOIN enrollments e ON e.student_id = s.id\nJOIN courses c ON c.id = e.course_id\nGROUP BY s.id, s.name\nORDER BY total_credits DESC, s.name\nLIMIT 3;",
    baseSql: "SELECT s.name, COUNT(e.course_id) AS total\nFROM students s\nJOIN enrollments e ON e.student_id = s.id\nGROUP BY s.name\nORDER BY total DESC, s.name\nLIMIT 3;",
    baseNote: "counts rows instead of summing credits — it runs fine but ranks the wrong weights (Kofi over Nina)",
  },
];

/* ---------------- 2. Music Store Dataset ---------------- */

const MUSIC_SCHEMA = `
CREATE TABLE artists (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE albums (id INTEGER PRIMARY KEY, title TEXT, artist_id INTEGER);
CREATE TABLE genres (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE tracks (id INTEGER PRIMARY KEY, title TEXT, album_id INTEGER, genre_id INTEGER, milliseconds INTEGER, unit_price REAL);

INSERT INTO artists VALUES
  (1, 'Miles Davis'), (2, 'Led Zeppelin'), (3, 'Daft Punk'), (4, 'Chopin');

INSERT INTO albums VALUES
  (1, 'Kind of Blue', 1),
  (2, 'Led Zeppelin IV', 2),
  (3, 'Discovery', 3),
  (4, 'Nocturnes', 4),
  (5, 'Random Access Memories', 3);

INSERT INTO genres VALUES
  (1, 'Jazz'), (2, 'Rock'), (3, 'Electronic'), (4, 'Classical');

INSERT INTO tracks VALUES
  (101, 'So What', 1, 1, 562000, 1.29),
  (102, 'Freddie Freeloader', 1, 1, 589000, 1.29),
  (103, 'Stairway to Heaven', 2, 2, 482000, 1.49),
  (104, 'Black Dog', 2, 2, 296000, 0.99),
  (105, 'One More Time', 3, 3, 320000, 1.29),
  (106, 'Harder, Better, Faster', 3, 3, 224000, 1.29),
  (107, 'Get Lucky', 5, 3, 369000, 1.49),
  (108, 'Nocturne in E-flat', 4, 4, 270000, 0.99);
`;

const MUSIC_PRESETS: SqlPreset[] = [
  {
    id: "electronic-tracks",
    label: "multi-table join",
    question: "Find all tracks in the 'Electronic' genre with their album title and duration in minutes.",
    think: [
      "join tracks to albums and genres",
      "filter on genre name = 'Electronic'",
      "convert milliseconds to minutes: ROUND(milliseconds / 60000.0, 2)",
    ],
    sql: "SELECT t.title AS track_title, a.title AS album_title, ROUND(t.milliseconds / 60000.0, 2) AS minutes\nFROM tracks t\nJOIN albums a ON a.id = t.album_id\nJOIN genres g ON g.id = t.genre_id\nWHERE g.name = 'Electronic'\nORDER BY t.title;",
    baseSql: "SELECT t.title, a.title\nFROM tracks t, albums a\nWHERE t.genre_id = 'Electronic';",
    baseNote: "compares genre_id (integer) to string 'Electronic' without joining genres table → returns 0 rows",
  },
  {
    id: "artist-albums",
    label: "group by + count",
    question: "Which artists have released more than 1 album? Show artist name and album count.",
    think: [
      "artists JOIN albums on artist_id",
      "GROUP BY artist id and name",
      "HAVING COUNT(a.id) > 1",
    ],
    sql: "SELECT ar.name, COUNT(al.id) AS album_count\nFROM artists ar\nJOIN albums al ON al.artist_id = ar.id\nGROUP BY ar.id, ar.name\nHAVING COUNT(al.id) > 1\nORDER BY album_count DESC;",
    baseSql: "SELECT ar.name, COUNT(*)\nFROM artists ar\nWHERE COUNT(ar.id) > 1\nGROUP BY ar.name;",
    baseNote: "misuse of aggregate function inside WHERE clause instead of HAVING",
  },
];

/* ---------------- 3. Public Library Dataset ---------------- */

const LIBRARY_SCHEMA = `
CREATE TABLE authors (id INTEGER PRIMARY KEY, name TEXT, nationality TEXT);
CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT, author_id INTEGER, published_year INTEGER, total_copies INTEGER);
CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT, joined_date TEXT);
CREATE TABLE loans (id INTEGER PRIMARY KEY, book_id INTEGER, member_id INTEGER, status TEXT);

INSERT INTO authors VALUES
  (1, 'George Orwell', 'British'),
  (2, 'Gabriel Garcia Marquez', 'Colombian'),
  (3, 'Haruki Murakami', 'Japanese'),
  (4, 'Virginia Woolf', 'British');

INSERT INTO books VALUES
  (101, '1984', 1, 1949, 5),
  (102, 'Animal Farm', 1, 1945, 4),
  (103, 'One Hundred Years of Solitude', 2, 1967, 3),
  (104, 'Norwegian Wood', 3, 1987, 6),
  (105, 'Kafka on the Shore', 3, 2002, 4),
  (106, 'To the Lighthouse', 4, 1927, 2);

INSERT INTO members VALUES
  (1, 'Aarav Patel', '2024-01-15'),
  (2, 'Sarah Jenkins', '2024-02-10'),
  (3, 'Kenji Sato', '2024-03-01');

INSERT INTO loans VALUES
  (1, 101, 1, 'returned'),
  (2, 103, 1, 'borrowed'),
  (3, 104, 2, 'borrowed'),
  (4, 101, 3, 'borrowed');
`;

const LIBRARY_PRESETS: SqlPreset[] = [
  {
    id: "currently-borrowed",
    label: "join + condition",
    question: "List all books currently borrowed ('borrowed') along with the borrower's name.",
    think: [
      "join loans with books and members",
      "filter for status = 'borrowed'",
      "project book title and member name",
    ],
    sql: "SELECT b.title AS book_title, m.name AS borrower\nFROM loans l\nJOIN books b ON b.id = l.book_id\nJOIN members m ON m.id = l.member_id\nWHERE l.status = 'borrowed'\nORDER BY b.title;",
    baseSql: "SELECT b.title, m.name\nFROM books b\nJOIN members m ON b.id = m.id\nWHERE b.status = 'borrowed';",
    baseNote: "joins books to members directly on id instead of through the loans junction table",
  },
  {
    id: "british-books",
    label: "filter + subquery",
    question: "How many total copies of books written by British authors does the library own?",
    think: [
      "join books to authors where nationality = 'British'",
      "SUM the total_copies column",
    ],
    sql: "SELECT SUM(b.total_copies) AS total_british_copies\nFROM books b\nJOIN authors a ON a.id = b.author_id\nWHERE a.nationality = 'British';",
    baseSql: "SELECT COUNT(total_copies)\nFROM books\nWHERE author_id = 'British';",
    baseNote: "uses COUNT instead of SUM and compares author_id to string 'British'",
  },
];

/* ---------------- exported datasets ---------------- */

export const DATASETS: Dataset[] = [
  {
    id: "university",
    name: "University (Spider)",
    filename: "dev_university.db",
    badge: "5 tables · 47 rows",
    summary: "Academic schema with courses, departments, instructors, and enrollments.",
    schemaSql: UNIVERSITY_SCHEMA,
    tables: [
      { name: "departments", cols: ["id", "name"] },
      { name: "instructors", cols: ["id", "name", "dept_id"] },
      { name: "courses", cols: ["id", "title", "credits", "dept_id", "instructor_id"] },
      { name: "students", cols: ["id", "name", "dept_id"] },
      { name: "enrollments", cols: ["student_id", "course_id", "grade"] },
    ],
    presets: UNIVERSITY_PRESETS,
  },
  {
    id: "music",
    name: "Music Store",
    filename: "music_store.db",
    badge: "4 tables · 25 rows",
    summary: "Commercial audio catalog with artists, albums, genres, and track pricing.",
    schemaSql: MUSIC_SCHEMA,
    tables: [
      { name: "artists", cols: ["id", "name"] },
      { name: "albums", cols: ["id", "title", "artist_id"] },
      { name: "genres", cols: ["id", "name"] },
      { name: "tracks", cols: ["id", "title", "album_id", "genre_id", "milliseconds", "unit_price"] },
    ],
    presets: MUSIC_PRESETS,
  },
  {
    id: "library",
    name: "Public Library",
    filename: "public_library.db",
    badge: "4 tables · 20 rows",
    summary: "Catalog and lending records tracking authors, books, members, and active loans.",
    schemaSql: LIBRARY_SCHEMA,
    tables: [
      { name: "authors", cols: ["id", "name", "nationality"] },
      { name: "books", cols: ["id", "title", "author_id", "published_year", "total_copies"] },
      { name: "members", cols: ["id", "name", "joined_date"] },
      { name: "loans", cols: ["id", "book_id", "member_id", "status"] },
    ],
    presets: LIBRARY_PRESETS,
  },
];

// Fallback exports for existing single-dataset consumers
export const SCHEMA_SQL = UNIVERSITY_SCHEMA;
export const SCHEMA_TABLES = DATASETS[0].tables;
export const SQL_PRESETS = UNIVERSITY_PRESETS;
