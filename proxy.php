<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$dotenvPath = __DIR__ . '/.env';
if (!file_exists($dotenvPath)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Configuração incompleta no servidor.']);
    exit;
}

$env = parse_ini_file($dotenvPath);
$apiUrl = $env['API_URL'] ?? null;
$token  = $env['API_TOKEN'] ?? null;
$empresaId = $env['EMPRESA_ID'] ?? '1';

if (!$apiUrl || !$token) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Configuração incompleta no servidor.']);
    exit;
}

$input = file_get_contents('php://input');
$decoded = json_decode($input, true);

if (!$decoded || json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Dados inválidos.']);
    exit;
}

$requiredFields = ['nomecliente', 'cpfcliente', 'enderecocliente', 'cidade', 'telefone', 'email', 'dn'];
$missing = [];
foreach ($requiredFields as $field) {
    if (empty($decoded[$field])) {
        $missing[] = $field;
    }
}

if (!empty($missing)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Campos obrigatórios não preenchidos.']);
    exit;
}

$cpf = preg_replace('/\D/', '', $decoded['cpfcliente']);
if (strlen($cpf) !== 11) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'CPF inválido.']);
    exit;
}

if (!filter_var($decoded['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Email inválido.']);
    exit;
}

$decoded['empresa_id'] = (int) $empresaId;

$ch = curl_init($apiUrl);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($decoded),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json; charset=utf-8',
        'Authorization: Bearer ' . $token
    ],
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_TIMEOUT        => 30
]);

$response  = curl_exec($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(502);
    echo json_encode(['status' => 'error', 'message' => 'Erro ao conectar com o serviço externo.']);
    exit;
}

http_response_code($httpCode);
echo $response;
