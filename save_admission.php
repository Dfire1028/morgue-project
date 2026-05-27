<?php
header('Content-Type: application/json');

// Database configuration - change these!
$host = 'localhost';
$db   = 'morgue_db';
$user = 'root';       // your MySQL username
$pass = '12345fred@';           // your MySQL password
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get JSON input from the fetch request
$input = json_decode(file_get_contents('php://input'), true);

// Basic validation (add more as needed)
$required = ['caseNumber', 'admissionDate', 'admissionTime', 'height', 'weight', 'age', 'skinTone', 'gender', 'storageUnit', 'distinguishingMarks'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
        exit;
    }
}

// Prepare SQL with placeholders
$sql = "INSERT INTO admissions 
        (case_number, deceased_name, admission_date, admission_time, height, weight, age, skin_tone, gender, cause_of_death, storage_unit, distinguishing_marks, additional_notes)
        VALUES 
        (:case_number, :deceased_name, :admission_date, :admission_time, :height, :weight, :age, :skin_tone, :gender, :cause_of_death, :storage_unit, :distinguishing_marks, :additional_notes)";

$stmt = $pdo->prepare($sql);

$stmt->execute([
    'case_number'         => $input['caseNumber'],
    'deceased_name'       => $input['deceasedName'] ?? null,
    'admission_date'      => $input['admissionDate'],
    'admission_time'      => $input['admissionTime'],
    'height'              => $input['height'],
    'weight'              => $input['weight'],
    'age'                 => $input['age'],
    'skin_tone'           => $input['skinTone'],
    'gender'              => $input['gender'],
    'cause_of_death'      => $input['causeOfDeath'] ?? null,
    'storage_unit'        => $input['storageUnit'],
    'distinguishing_marks'=> $input['distinguishingMarks'],
    'additional_notes'    => $input['additionalNotes'] ?? null,
]);

echo json_encode(['success' => true, 'message' => 'Admission saved successfully']);