
INSERT INTO test_questions (test_id, question_text, question_type, options, correct_answer, marks, question_order) VALUES
-- Data Structures Quiz
('468cd1de-9571-4683-874c-fcd557978cae', 'What is the time complexity of accessing an element in an array by index?', 'mcq', '["O(1)","O(n)","O(log n)","O(n²)"]', 'O(1)', 5, 1),
('468cd1de-9571-4683-874c-fcd557978cae', 'Which data structure uses LIFO principle?', 'mcq', '["Queue","Stack","Array","Linked List"]', 'Stack', 5, 2),
('468cd1de-9571-4683-874c-fcd557978cae', 'What is the worst-case time complexity of inserting at the beginning of a singly linked list?', 'mcq', '["O(1)","O(n)","O(log n)","O(n²)"]', 'O(1)', 5, 3),
('468cd1de-9571-4683-874c-fcd557978cae', 'Which data structure is used for BFS traversal?', 'mcq', '["Stack","Queue","Priority Queue","Deque"]', 'Queue', 5, 4),
('468cd1de-9571-4683-874c-fcd557978cae', 'What is the maximum number of children a binary tree node can have?', 'mcq', '["1","2","3","Unlimited"]', '2', 5, 5),
-- Mathematics Test
('3fd0e7ef-5ac9-48ef-b096-61fc1a595e28', 'What is the derivative of x²?', 'mcq', '["x","2x","2x²","x/2"]', '2x', 5, 1),
('3fd0e7ef-5ac9-48ef-b096-61fc1a595e28', 'What is the integral of 1/x?', 'mcq', '["x","ln|x| + C","1/x² + C","x² + C"]', 'ln|x| + C', 5, 2),
('3fd0e7ef-5ac9-48ef-b096-61fc1a595e28', 'What is the determinant of a 2x2 identity matrix?', 'mcq', '["0","1","2","-1"]', '1', 5, 3),
('3fd0e7ef-5ac9-48ef-b096-61fc1a595e28', 'The rank of a 3x3 zero matrix is:', 'mcq', '["0","1","2","3"]', '0', 5, 4),
('3fd0e7ef-5ac9-48ef-b096-61fc1a595e28', 'lim(x→0) sin(x)/x equals:', 'mcq', '["0","1","∞","undefined"]', '1', 5, 5);
