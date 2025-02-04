<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $requiredFields = ['domain', 'serverIP', 'mailHELO', 'ptrIP', 'dkim', 'spf'];
        $data = array_map('trim', array_intersect_key($_POST, array_flip($requiredFields)));

        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                throw new Exception('Todos os campos obrigatórios devem ser preenchidos.');
            }
        }

        $ipRegex = '/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/';
        foreach (['serverIP', 'ptrIP'] as $ipField) {
            if (!preg_match($ipRegex, $data[$ipField])) {
                throw new Exception('Os IPs fornecidos são inválidos.');
            }
        }

        date_default_timezone_set('Europe/Lisbon');
        $currentDate = date('Y-m-d H:i:s');
        $records = [
            ";;",
            ";; Domain:\t{$data['domain']}",
            ";; Exported:\t$currentDate",
            ";;",
            ";; A Records"
        ];

        if (!empty($_POST['custom_records'])) {
            $customRecords = json_decode($_POST['custom_records'], true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Erro ao processar registos personalizados');
            }
            foreach ($customRecords as $record) {
                if (empty($record['name']) || empty($record['ip']) || !preg_match($ipRegex, $record['ip'])) {
                    throw new Exception('Nome e IP são obrigatórios e válidos em registos personalizados');
                }
                $proxyStatus = !empty($record['proxy']) ? 'true' : 'false';
                $records[] = "{$record['name']}.{$data['domain']}.\t1\tIN\tA\t{$record['ip']} ; cf_tags=cf-proxied:$proxyStatus";
            }
        }

        $mainProxyStatus = !empty($_POST['proxy_main']) ? 'true' : 'false';
        $records[] = "{$data['domain']}.\t1\tIN\tA\t{$data['serverIP']} ; cf_tags=cf-proxied:$mainProxyStatus";

        $subdomains = ['cpanel', 'ftp', 'mail', 'webmail', 'webdisk', 'cpcontacts', 'cpcalendars', 'autodiscover', 'autoconfig'];
        foreach ($subdomains as $subdomain) {
            $proxyStatus = !empty($_POST["proxy_$subdomain"]) ? 'true' : 'false';
            $records[] = "$subdomain.{$data['domain']}.\t1\tIN\tA\t{$data['serverIP']} ; cf_tags=cf-proxied:$proxyStatus";
        }

        $records[] = "\n;; CNAME Records";
        $records[] = "www.{$data['domain']}.\t1\tIN\tCNAME\t{$data['domain']}.";

        $records[] = "\n;; MX Records";
        $records[] = "{$data['domain']}.\t1\tIN\tMX\t0 mail.{$data['domain']}.";

        $records[] = "\n;; TXT Records";
        $records[] = "default._domainkey.{$data['domain']}.\t1\tIN\tTXT\t\"v=DKIM1; k=rsa; p={$data['dkim']}\"";
        $records[] = "{$data['domain']}.\t1\tIN\tTXT\t\"v=spf1 {$data['spf']} -all\"";

        $filename = "dns_records_" . preg_replace('/[^a-zA-Z0-9.-]/', '_', $data['domain']) . ".txt";
        header('Content-Type: text/plain');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        echo implode("\n", $records);
        exit;

    } catch (Exception $e) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['error' => $e->getMessage()]);
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gerador de Registos DNS</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link href="styles.css" rel="stylesheet">
</head>
<body>
    <div class="container">
        <h2>Gerador de Registos DNS</h2>
        
        <div class="content-wrapper">
            <div class="form-wrapper">
                <form method="POST" id="dnsForm">
                    <div class="form-section">
                        <h3>Informações Básicas</h3>
                        <div class="form-group">
                            <label for="domain">Domínio *</label>
                            <input type="text" id="domain" name="domain" required placeholder="exemplo.com">
                        </div>
                        <div class="form-group">
                            <label for="serverIP">IP do Servidor *</label>
                            <div class="ip-input-group">
                                <input type="text" id="serverIP" name="serverIP" class="ip-input" required placeholder="192.168.1.1" oninput="formatIPInput(this)" onchange="validateIP(this)">
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h3>Configurações de Email</h3>
                        <div class="form-group">
                            <label for="mailHELO">Mail HELO *</label>
                            <input type="text" id="mailHELO" name="mailHELO" required placeholder="mail.exemplo.com">
                        </div>
                        <div class="form-group">
                            <label for="ptrIP">IP da Entrada PTR *</label>
                            <div class="ip-input-group">
                                <input type="text" id="ptrIP" name="ptrIP" class="ip-input" required placeholder="192.168.1.2" oninput="formatIPInput(this)" onchange="validateIP(this)">
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h3>Configurações de Segurança</h3>
                        <div class="form-group">
                            <label for="dkim">Valor DKIM *</label>
                            <textarea id="dkim" name="dkim" required placeholder="Insira o valor DKIM..."></textarea>
                        </div>
                        <div class="form-group">
                            <label for="spf">Valor SPF *</label>
                            <textarea id="spf" name="spf" required placeholder="Insira o valor SPF..."></textarea>
                        </div>
                    </div>

                    <div class="form-section">
                        <h3>Registos A Personalizados</h3>
                        <div id="custom-records"></div>
                        <button type="button" class="add-record" onclick="addNewRecord()">+ Adicionar Registo</button>
                    </div>

                    <div class="form-section">
                        <h3>Configurações do Cloudflare Proxy</h3>
                        <div class="proxy-grid">
                            <div class="switch-wrapper switch-wrapper-main">
                                <input type="checkbox" id="proxy_main" name="proxy_main" checked>
                                <label for="proxy_main">Domínio Principal</label>
                            </div>
                            <?php
                            $subdomains = ['cpanel', 'ftp', 'mail', 'webmail', 'webdisk', 'cpcontacts', 'cpcalendars', 'autodiscover', 'autoconfig'];
                            foreach ($subdomains as $subdomain) {
                                echo "<div class='switch-wrapper'>
                                        <input type='checkbox' id='proxy_$subdomain' name='proxy_$subdomain'>
                                        <label for='proxy_$subdomain'>$subdomain</label>
                                      </div>";
                            }
                            ?>
                        </div>
                        <div class="button-group">
                            <button type="button" onclick="toggleAllProxies(true)">Ativar Todos</button>
                            <button type="button" onclick="toggleAllProxies(false)">Desativar Todos</button>
                        </div>
                    </div>
                </form>
            </div>

            <div class="summary-wrapper">
                <div class="summary-content">
                    <h3>Resumo das Configurações</h3>
                    <div class="summary-section">
                        <h4>Informações Básicas</h4>
                        <div id="summary-basic"></div>
                    </div>
                    <div class="summary-section">
                        <h4>Configurações de Email</h4>
                        <div id="summary-email"></div>
                    </div>
                    <div class="summary-section">
                        <h4>Configurações de Segurança</h4>
                        <div id="summary-security"></div>
                    </div>
                    <div class="summary-section">
                        <h4>Registos A Personalizados</h4>
                        <div id="summary-records"></div>
                    </div>
                    <div class="summary-section">
                        <h4>Configurações de Proxy</h4>
                        <div id="summary-proxy"></div>
                    </div>
                </div>
                <div class="action-buttons">
                    <button type="submit" form="dnsForm" class="btn-primary" id="gerarDNSBtn" disabled>Gerar DNS</button>
                    <button type="button" class="btn-danger" onclick="limparFormulario()">Limpar</button>
                </div>
            </div>
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>
