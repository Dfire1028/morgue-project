<?php
header('Content-Type: application/json');
// ... same PDO connection ...
$stmt = $pdo->query("SELECT * FROM admissions ORDER BY created_at DESC");
$admissions = $stmt->fetchAll();
echo json_encode($admissions);