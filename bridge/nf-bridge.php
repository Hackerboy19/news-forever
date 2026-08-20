<?php
/**
 * News Forever DB Bridge
 * ----------------------
 * Upload this single file to public_html/ on the newsforever.in cPanel
 * hosting (same folder that contains the CodeIgniter application/ and
 * system/ directories). It gives the Vercel frontend authenticated
 * read/write access to the ci_blog table via localhost MySQL — no
 * remote-MySQL access needed.
 *
 * Security model:
 *   1. Every request must carry header  X-Bridge-Key  matching BRIDGE_KEY.
 *   2. Every write additionally carries admin username/password verified
 *      against the real ci_admin table.
 *   3. Prepared statements only; whitelisted actions only.
 */

// ======= CONFIG =======
// Set by the generator — must match the BRIDGE_KEY env var on Vercel.
const BRIDGE_KEY = '__BRIDGE_KEY__';

// --- SEPARATE TEST DATABASE (Option C) ---
// Fill these in to point the bridge at a SEPARATE test database instead of
// the live site DB. The production database is then never touched.
// Create the DB in cPanel > MySQL Databases, import the dump into it, and
// enter its name / user / password below. Leave DB_TEST_NAME empty to fall
// back to the live CodeIgniter config.
const DB_TEST_HOST = 'localhost';
const DB_TEST_NAME = '';   // e.g. 'jaipurwe_fsianews_test'
const DB_TEST_USER = '';   // e.g. 'jaipurwe_testuser'
const DB_TEST_PASS = '';

// Live CodeIgniter config — only used when DB_TEST_NAME above is empty.
$ciConfig = __DIR__ . '/application/config/database.php';
// ======================

header('Content-Type: application/json; charset=utf-8');

function fail(int $code, string $msg): void {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

// --- Bridge key check ---
$key = $_SERVER['HTTP_X_BRIDGE_KEY'] ?? '';
if (!hash_equals(BRIDGE_KEY, $key)) {
    fail(401, 'Invalid bridge key');
}

// --- DB connection: separate test DB if configured, else live CI config ---
mysqli_report(MYSQLI_REPORT_OFF);
if (DB_TEST_NAME !== '') {
    $conn = @new mysqli(DB_TEST_HOST, DB_TEST_USER, DB_TEST_PASS, DB_TEST_NAME);
} else {
    if (!file_exists($ciConfig)) {
        fail(500, 'CI database config not found — adjust $ciConfig path in nf-bridge.php');
    }
    if (!defined('BASEPATH')) define('BASEPATH', '1'); // CI config guard
    require $ciConfig;
    $cfg = $db['default'] ?? null;
    if (!$cfg) fail(500, 'CI config parsed but default group missing');
    $conn = @new mysqli($cfg['hostname'], $cfg['username'], $cfg['password'], $cfg['database']);
}
if ($conn->connect_errno) fail(500, 'DB connect failed: ' . $conn->connect_error);
$conn->set_charset('utf8mb4');

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$action = $_GET['action'] ?? ($body['action'] ?? '');

// --- Admin verification against real ci_admin ---
function verify_admin(mysqli $conn, string $user, string $pass): ?array {
    if ($user === '' || $pass === '') return null;
    $stmt = $conn->prepare(
        'SELECT admin_id, username, firstname, lastname FROM ci_admin
         WHERE username = ? AND password = ? AND is_active = 1 LIMIT 1'
    );
    $stmt->bind_param('ss', $user, $pass);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if (!$row) return null;
    $name = trim(($row['firstname'] ?? '') . ' ' . ($row['lastname'] ?? ''));
    return [
        'admin_id' => (int)$row['admin_id'],
        'username' => $row['username'],
        'name' => $name !== '' ? $name : $row['username'],
    ];
}

$BLOG_SELECT = "SELECT b.id, b.user_created_by, b.title, b.cat_id, b.sub_cat_id, b.type, b.tag_id,
       b.youtube_video_link, b.image, b.alt_tag, b.url, b.meta_title, b.meta_keyword,
       b.meta_description, b.h2_tag, b.h3_tag, b.h4_tag, b.h5_tag, b.h6_tag,
       b.og_title, b.og_url, b.og_description, b.og_image, b.description, b.status, b.created_at,
       c.cat_name AS category_name, sc.cat_name AS sub_category_name,
       a.firstname AS author_firstname, a.lastname AS author_lastname
  FROM ci_blog b
  LEFT JOIN ci_category c ON b.cat_id = c.id
  LEFT JOIN ci_category sc ON b.sub_cat_id = sc.id
  LEFT JOIN ci_admin a ON b.user_created_by = a.admin_id";

/** Columns writable through the bridge (frontend name => ci_blog column). */
$WRITABLE = [
    'title' => 'title', 'category_id' => 'cat_id', 'sub_category_id' => 'sub_cat_id', 'type' => 'type',
    'image' => 'image', 'alt_tag' => 'alt_tag', 'url' => 'url',
    'meta_title' => 'meta_title', 'meta_keyword' => 'meta_keyword', 'meta_description' => 'meta_description',
    'h2_tag' => 'h2_tag', 'h3_tag' => 'h3_tag', 'h4_tag' => 'h4_tag', 'h5_tag' => 'h5_tag', 'h6_tag' => 'h6_tag',
    'og_title' => 'og_title', 'og_url' => 'og_url', 'og_description' => 'og_description', 'og_image' => 'og_image',
    'content' => 'description', 'status' => 'status', 'youtube_video_link' => 'youtube_video_link',
];

function legacy_asset_path(string $v): string {
    return trim(preg_replace('#^https?://[^/]+/#i', '', $v));
}

function extract_cols(array $payload, array $WRITABLE): array {
    $cols = [];
    foreach ($WRITABLE as $front => $col) {
        if (!array_key_exists($front, $payload)) continue;
        $val = $payload[$front];
        if (in_array($col, ['image', 'og_image'], true)) $val = legacy_asset_path((string)$val);
        if ($front === 'url') $val = trim((string)$val);
        if (in_array($col, ['cat_id', 'sub_cat_id', 'status', 'type'], true)) $val = (int)$val;
        $cols[$col] = $val;
    }
    if (isset($payload['tag_ids']) && is_array($payload['tag_ids'])) {
        $cols['tag_id'] = implode(',', array_map('intval', $payload['tag_ids']));
    }
    return $cols;
}

function fetch_blog(mysqli $conn, string $BLOG_SELECT, int $id): ?array {
    $stmt = $conn->prepare($BLOG_SELECT . ' WHERE b.id = ? LIMIT 1');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc() ?: null;
}

switch ($action) {

    case 'ping':
        $n = $conn->query('SELECT COUNT(*) c FROM ci_blog')->fetch_assoc();
        echo json_encode(['ok' => true, 'blogs' => (int)$n['c']]);
        break;

    case 'login': {
        $admin = verify_admin($conn, (string)($body['username'] ?? ''), (string)($body['password'] ?? ''));
        if (!$admin) fail(401, 'Invalid credentials');
        echo json_encode($admin);
        break;
    }

    case 'list': {
        $admin = verify_admin($conn, (string)($body['username'] ?? ''), (string)($body['password'] ?? ''));
        if (!$admin) fail(401, 'Unauthorized');
        $limit = min(1000, max(1, (int)($body['limit'] ?? 500)));
        $res = $conn->query($BLOG_SELECT . " ORDER BY b.created_at DESC, b.id DESC LIMIT $limit");
        echo json_encode(['rows' => $res->fetch_all(MYSQLI_ASSOC)]);
        break;
    }

    case 'get': {
        $admin = verify_admin($conn, (string)($body['username'] ?? ''), (string)($body['password'] ?? ''));
        if (!$admin) fail(401, 'Unauthorized');
        $row = fetch_blog($conn, $BLOG_SELECT, (int)($body['id'] ?? 0));
        if (!$row) fail(404, 'Not found');
        echo json_encode(['row' => $row]);
        break;
    }

    case 'create': {
        $admin = verify_admin($conn, (string)($body['username'] ?? ''), (string)($body['password'] ?? ''));
        if (!$admin) fail(401, 'Unauthorized');
        $cols = extract_cols($body['payload'] ?? [], $WRITABLE);
        // NOT NULL columns need explicit defaults (legacy schema)
        $defaults = [
            'title' => '', 'cat_id' => 0, 'sub_cat_id' => 0, 'type' => 0, 'tag_id' => '',
            'image' => '', 'alt_tag' => '', 'video_type' => '', 'video_name' => '',
            'youtube_video_link' => '', 'amazon_webserver_video_link' => '', 'url' => '',
            'meta_title' => '', 'meta_keyword' => '', 'meta_description' => '',
            'h2_tag' => '', 'h3_tag' => '', 'h4_tag' => '', 'h5_tag' => '', 'h6_tag' => '',
            'og_title' => '', 'og_url' => '', 'og_description' => '', 'og_image' => '',
            'description' => '', 'status' => 1,
        ];
        $row = array_merge($defaults, $cols);
        $row['user_created_by'] = $admin['admin_id'];
        $row['created_at'] = date('Y-m-d') . ' : ' . date('H:i:s');

        $names = array_keys($row);
        $placeholders = implode(',', array_fill(0, count($names), '?'));
        $sql = 'INSERT INTO ci_blog (`' . implode('`,`', $names) . '`) VALUES (' . $placeholders . ')';
        $stmt = $conn->prepare($sql);
        $types = '';
        $vals = [];
        foreach ($row as $v) { $types .= is_int($v) ? 'i' : 's'; $vals[] = $v; }
        $stmt->bind_param($types, ...$vals);
        if (!$stmt->execute()) fail(500, 'Insert failed: ' . $stmt->error);
        echo json_encode(['row' => fetch_blog($conn, $BLOG_SELECT, (int)$conn->insert_id)]);
        break;
    }

    case 'update': {
        $admin = verify_admin($conn, (string)($body['username'] ?? ''), (string)($body['password'] ?? ''));
        if (!$admin) fail(401, 'Unauthorized');
        $id = (int)($body['id'] ?? 0);
        if ($id <= 0) fail(400, 'id required');
        $cols = extract_cols($body['payload'] ?? [], $WRITABLE);
        if ($cols) {
            $sets = implode(', ', array_map(fn($c) => "`$c` = ?", array_keys($cols)));
            $stmt = $conn->prepare("UPDATE ci_blog SET $sets WHERE id = ?");
            $types = '';
            $vals = [];
            foreach ($cols as $v) { $types .= is_int($v) ? 'i' : 's'; $vals[] = $v; }
            $types .= 'i';
            $vals[] = $id;
            $stmt->bind_param($types, ...$vals);
            if (!$stmt->execute()) fail(500, 'Update failed: ' . $stmt->error);
        }
        $row = fetch_blog($conn, $BLOG_SELECT, $id);
        if (!$row) fail(404, 'Not found');
        echo json_encode(['row' => $row]);
        break;
    }

    case 'delete': {
        $admin = verify_admin($conn, (string)($body['username'] ?? ''), (string)($body['password'] ?? ''));
        if (!$admin) fail(401, 'Unauthorized');
        $id = (int)($body['id'] ?? 0);
        $stmt = $conn->prepare('DELETE FROM ci_blog WHERE id = ?');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        echo json_encode(['success' => $stmt->affected_rows > 0, 'id' => $id]);
        break;
    }

    case 'upload-image': {
        $admin = verify_admin($conn, (string)($body['username'] ?? ''), (string)($body['password'] ?? ''));
        if (!$admin) fail(401, 'Unauthorized');
        $folder = (string)($body['folder'] ?? 'blog');
        if (!in_array($folder, ['blog', 'advertisement'], true)) fail(400, 'Invalid folder');
        $name = preg_replace('/[^a-zA-Z0-9._-]/', '', (string)($body['filename'] ?? ''));
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'], true)) fail(400, 'Only jpg/png/gif/webp allowed');
        $data = base64_decode((string)($body['data'] ?? ''), true);
        if ($data === false || strlen($data) < 100) fail(400, 'Invalid image data');
        if (strlen($data) > 8 * 1024 * 1024) fail(400, 'Image too large (max 8MB)');
        // Content sniff: must decode as a real image
        if (@imagecreatefromstring($data) === false) fail(400, 'File is not a valid image');
        $dir = __DIR__ . '/assets/img/' . $folder;
        if (!is_dir($dir) && !mkdir($dir, 0755, true)) fail(500, 'Cannot create target directory');
        $final = time() . '_' . ($name !== '' ? $name : ('upload.' . $ext));
        if (file_put_contents($dir . '/' . $final, $data) === false) fail(500, 'Write failed');
        $path = 'assets/img/' . $folder . '/' . $final;
        // Register blog uploads in the image library like the legacy CMS
        if ($folder === 'blog') {
            $stmt = $conn->prepare('INSERT INTO ci_imagelibrary (user_id, url, image, created_at) VALUES (?, ?, ?, ?)');
            $alt = (string)($body['alt'] ?? $name);
            $ts = date('Y-m-d') . ' : ' . date('H:i:s');
            $stmt->bind_param('isss', $admin['admin_id'], $alt, $path, $ts);
            $stmt->execute();
        }
        echo json_encode(['success' => true, 'path' => $path]);
        break;
    }

    case 'ad-save': {
        $admin = verify_admin($conn, (string)($body['username'] ?? ''), (string)($body['password'] ?? ''));
        if (!$admin) fail(401, 'Unauthorized');
        $pl = $body['payload'] ?? [];
        $cols = [
            'advertisement_title' => (string)($pl['title'] ?? ''),
            'advertisement_url' => (string)($pl['url'] ?? ''),
            'advertisement_image' => legacy_asset_path((string)($pl['advertisement_image'] ?? '')),
            'alt_tag' => (string)($pl['alt_tag'] ?? ''),
            'position' => (string)($pl['position'] ?? 'right'),
            'priority' => (int)($pl['priority'] ?? 2),
            'status' => (int)($pl['status'] ?? 1),
        ];
        $id = (int)($body['id'] ?? 0);
        if ($id > 0) {
            $stmt = $conn->prepare('UPDATE ci_advertisement SET advertisement_title=?, advertisement_url=?, advertisement_image=?, alt_tag=?, position=?, priority=?, status=? WHERE id=?');
            $stmt->bind_param('sssssiii', $cols['advertisement_title'], $cols['advertisement_url'], $cols['advertisement_image'], $cols['alt_tag'], $cols['position'], $cols['priority'], $cols['status'], $id);
        } else {
            $ts = date('Y-m-d') . ' : ' . date('H:i:s');
            $stmt = $conn->prepare('INSERT INTO ci_advertisement (advertisement_title, advertisement_url, advertisement_image, alt_tag, position, priority, status, created_at) VALUES (?,?,?,?,?,?,?,?)');
            $stmt->bind_param('sssssiis', $cols['advertisement_title'], $cols['advertisement_url'], $cols['advertisement_image'], $cols['alt_tag'], $cols['position'], $cols['priority'], $cols['status'], $ts);
        }
        if (!$stmt->execute()) fail(500, 'Ad save failed: ' . $stmt->error);
        $res = $conn->query('SELECT * FROM ci_advertisement WHERE status = 1 ORDER BY priority ASC, id DESC');
        echo json_encode(['rows' => $res->fetch_all(MYSQLI_ASSOC)]);
        break;
    }

    case 'ad-delete': {
        $admin = verify_admin($conn, (string)($body['username'] ?? ''), (string)($body['password'] ?? ''));
        if (!$admin) fail(401, 'Unauthorized');
        $id = (int)($body['id'] ?? 0);
        $stmt = $conn->prepare('DELETE FROM ci_advertisement WHERE id = ?');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        echo json_encode(['success' => $stmt->affected_rows > 0]);
        break;
    }

    case 'cat-save': {
        $admin = verify_admin($conn, (string)($body['username'] ?? ''), (string)($body['password'] ?? ''));
        if (!$admin) fail(401, 'Unauthorized');
        $pl = $body['payload'] ?? [];
        $id = (int)($body['id'] ?? 0);
        $name = (string)($pl['category_name'] ?? '');
        $slug = trim((string)($pl['slug'] ?? ''));
        $parent = (int)($pl['parent_id'] ?? 0);
        $status = (int)($pl['status'] ?? 1);
        if ($id > 0) {
            $stmt = $conn->prepare('UPDATE ci_category SET cat_name=?, url=?, parent_id=?, status=? WHERE id=?');
            $stmt->bind_param('ssiii', $name, $slug, $parent, $status, $id);
        } else {
            $ts = date('Y-m-d') . ' : ' . date('H:i:s');
            $stmt = $conn->prepare("INSERT INTO ci_category (parent_id, url, cat_name, meta_title, meta_keyword, meta_description, h2_tag, h3_tag, h4_tag, h5_tag, h6_tag, og_title, og_url, og_description, og_image, status, created_at) VALUES (?,?,?,?, '', '', '', '', '', '', '', '', '', '', '', ?, ?)");
            $stmt->bind_param('isssis', $parent, $slug, $name, $name, $status, $ts);
        }
        if (!$stmt->execute()) fail(500, 'Category save failed: ' . $stmt->error);
        echo json_encode(['success' => true]);
        break;
    }

    case 'cat-delete': {
        $admin = verify_admin($conn, (string)($body['username'] ?? ''), (string)($body['password'] ?? ''));
        if (!$admin) fail(401, 'Unauthorized');
        $id = (int)($body['id'] ?? 0);
        $stmt = $conn->prepare('DELETE FROM ci_category WHERE id = ?');
        $stmt->bind_param('i', $id);
        $stmt->execute();
        echo json_encode(['success' => $stmt->affected_rows > 0]);
        break;
    }

    case 'subs-list': {
        $admin = verify_admin($conn, (string)($body['username'] ?? ''), (string)($body['password'] ?? ''));
        if (!$admin) fail(401, 'Unauthorized');
        $res = $conn->query("SELECT id, email, created_at FROM ci_subscribe ORDER BY id DESC LIMIT 500");
        echo json_encode(['rows' => $res ? $res->fetch_all(MYSQLI_ASSOC) : []]);
        break;
    }
    case 'users-list': {
        $admin = verify_admin($conn, (string)($body['username'] ?? ''), (string)($body['password'] ?? ''));
        if (!$admin) fail(401, 'Unauthorized');
        $res = $conn->query("SELECT admin_id, username, firstname, lastname, email, image, is_active, is_supper, last_login FROM ci_admin ORDER BY admin_id ASC");
        echo json_encode(['rows' => $res ? $res->fetch_all(MYSQLI_ASSOC) : []]);
        break;
    }
    case 'images-list': {
        $admin = verify_admin($conn, (string)($body['username'] ?? ''), (string)($body['password'] ?? ''));
        if (!$admin) fail(401, 'Unauthorized');
        $res = $conn->query("SELECT id, user_id, url, image, created_at FROM ci_imagelibrary ORDER BY id DESC LIMIT 300");
        echo json_encode(['rows' => $res ? $res->fetch_all(MYSQLI_ASSOC) : []]);
        break;
    }
    case 'logs-list': {
        $admin = verify_admin($conn, (string)($body['username'] ?? ''), (string)($body['password'] ?? ''));
        if (!$admin) fail(401, 'Unauthorized');
        $res = $conn->query("SELECT l.id, l.activity_id, l.user_id, l.admin_id, l.created_at, a.username, a.firstname, a.lastname FROM ci_activity_log l LEFT JOIN ci_admin a ON l.admin_id=a.admin_id ORDER BY l.id DESC LIMIT 100");
        echo json_encode(['rows' => $res ? $res->fetch_all(MYSQLI_ASSOC) : []]);
        break;
    }
    case 'config-get': {
        // Public read — theme colours & nav tabs are visible on the site anyway
        $res = $conn->query("SELECT page_description FROM ci_setting WHERE page_key = 'nf_site_config' LIMIT 1");
        $row = $res ? $res->fetch_assoc() : null;
        echo json_encode(['config' => $row ? $row['page_description'] : '{}']);
        break;
    }

    case 'config-save': {
        $admin = verify_admin($conn, (string)($body['username'] ?? ''), (string)($body['password'] ?? ''));
        if (!$admin) fail(401, 'Unauthorized');
        $json = (string)($body['config'] ?? '{}');
        $chk = $conn->query("SELECT id FROM ci_setting WHERE page_key = 'nf_site_config' LIMIT 1");
        if ($chk && $chk->num_rows > 0) {
            $stmt = $conn->prepare("UPDATE ci_setting SET page_description = ? WHERE page_key = 'nf_site_config'");
            $stmt->bind_param('s', $json);
        } else {
            $stmt = $conn->prepare("INSERT INTO ci_setting (page_key, page_description, email, phone, address, map, status) VALUES ('nf_site_config', ?, '', '', '', '', 1)");
            $stmt->bind_param('s', $json);
        }
        if (!$stmt->execute()) fail(500, 'Config save failed: ' . $stmt->error);
        echo json_encode(['success' => true]);
        break;
    }

    case 'change-password': {
        $admin = verify_admin($conn, (string)($body['username'] ?? ''), (string)($body['password'] ?? ''));
        if (!$admin) fail(401, 'Current password incorrect');
        $new = (string)($body['new_password'] ?? '');
        if (strlen($new) < 6) fail(400, 'New password must be at least 6 characters');
        $stmt = $conn->prepare('UPDATE ci_admin SET password = ? WHERE admin_id = ?');
        $stmt->bind_param('si', $new, $admin['admin_id']);
        if (!$stmt->execute()) fail(500, 'Password update failed');
        echo json_encode(['success' => true]);
        break;
    }

    case 'bulk': {
        $admin = verify_admin($conn, (string)($body['username'] ?? ''), (string)($body['password'] ?? ''));
        if (!$admin) fail(401, 'Unauthorized');
        $ids = array_values(array_filter(array_map('intval', (array)($body['ids'] ?? []))));
        $op = (string)($body['op'] ?? '');
        if (!$ids || !in_array($op, ['activate', 'deactivate', 'delete'], true)) fail(400, 'Invalid bulk payload');
        $in = implode(',', $ids);
        if ($op === 'delete') {
            $conn->query("DELETE FROM ci_blog WHERE id IN ($in)");
        } else {
            $status = $op === 'activate' ? 1 : 0;
            $conn->query("UPDATE ci_blog SET status = $status WHERE id IN ($in)");
        }
        echo json_encode(['success' => true, 'affected' => $conn->affected_rows]);
        break;
    }

    default:
        fail(400, 'Unknown action');
}
