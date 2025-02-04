function limparFormulario() {
    document.getElementById('dnsForm').reset();
    document.getElementById('custom-records').innerHTML = '';
    checkRequiredFields();
    updateSummary();
}

let ipValidationTimeout;

function formatIPInput(input) {
    input.value = input.value.replace(/[^0-9.]/g, '').split('.').map(part => part.slice(0, 3)).join('.');
    return input.value;
}

function validateIP(input) {
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    clearTimeout(ipValidationTimeout);
    input.classList.add('ip-input');
    if (!input.value.trim()) {
        input.setCustomValidity('');
        input.style.backgroundImage = '';
        return;
    }
    if (!ipRegex.test(input.value)) {
        input.setCustomValidity('IP inválido');
        input.style.backgroundImage = '';
        return;
    }
    input.setCustomValidity('');
    input.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23999\' d=\'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z\' opacity=\'.5\'/%3E%3Cpath fill=\'%23999\' d=\'M20 12h2A10 10 0 0 0 12 2v2a8 8 0 0 1 8 8z\'%3E%3CanimateTransform attributeName=\'transform\' dur=\'1s\' from=\'0 12 12\' repeatCount=\'indefinite\' to=\'360 12 12\' type=\'rotate\'/%3E%3C/path%3E%3C/svg%3E")';
    ipValidationTimeout = setTimeout(() => {
        fetch(`https://ipwhois.app/json/${input.value}?lang=pt`)
            .then(response => response.ok ? response.json() : Promise.reject('Falha na resposta da API'))
            .then(data => {
                if (data.country_code) {
                    const countryCode = data.country_code.toLowerCase();
                    const flagUrl = `https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${countryCode}.svg`;
                    const img = new Image();
                    img.onload = () => input.style.backgroundImage = `url(${flagUrl})`;
                    img.onerror = () => {
                        const altFlagUrl = `https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode.toUpperCase()}.svg`;
                        const altImg = new Image();
                        altImg.onload = () => input.style.backgroundImage = `url(${altFlagUrl})`;
                        altImg.onerror = () => input.style.backgroundImage = '';
                        altImg.src = altFlagUrl;
                    };
                    img.src = flagUrl;
                    input.title = data.country || '';
                }
            })
            .catch(() => {
                input.style.backgroundImage = '';
                fetch(`https://ipapi.co/${input.value}/json/`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.country_code) {
                            const countryCode = data.country_code.toLowerCase();
                            const flagUrl = `https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${countryCode}.svg`;
                            const img = new Image();
                            img.onload = () => input.style.backgroundImage = `url(${flagUrl})`;
                            img.onerror = () => {
                                const altFlagUrl = `https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode.toUpperCase()}.svg`;
                                const altImg = new Image();
                                altImg.onload = () => input.style.backgroundImage = `url(${altFlagUrl})`;
                                altImg.src = altFlagUrl;
                            };
                            img.src = flagUrl;
                            input.title = data.country_name || '';
                        }
                    })
                    .catch(() => input.style.backgroundImage = '');
            })
            .finally(updateSummary);
    }, 500);
}

function addNewRecord() {
    const container = document.getElementById('custom-records');
    const recordDiv = document.createElement('div');
    recordDiv.className = 'custom-record';
    recordDiv.innerHTML = `
        <input type="text" class="record-name" placeholder="Nome do registo">
        <div class="ip-input-group">
            <input type="text" class="record-ip" placeholder="Endereço IP">
        </div>
        <div class="switch-wrapper custom-record-switch">
            <input type="checkbox" class="record-proxy" checked>
            <label>Proxy</label>
        </div>
        <button type="button" class="record-delete" onclick="deleteRecord(this)">×</button>
    `;
    container.appendChild(recordDiv);

    const nameInput = recordDiv.querySelector('.record-name');
    const ipInput = recordDiv.querySelector('.record-ip');
    const proxyInput = recordDiv.querySelector('.record-proxy');

    nameInput.addEventListener('input', () => {
        ipInput.required = !!nameInput.value.trim();
        checkRequiredFields();
        updateSummary();
    });

    ipInput.addEventListener('input', (e) => {
        nameInput.required = !!ipInput.value.trim();
        formatIPInput(e.target);
        validateIP(e.target);
        checkRequiredFields();
        updateSummary();
    });

    ipInput.addEventListener('blur', (e) => validateIP(e.target));

    proxyInput.addEventListener('change', () => {
        updateSummary();
    });

    updateSummary();
}

function deleteRecord(button) {
    button.closest('.custom-record').remove();
    checkRequiredFields();
    updateSummary();
}

function getCustomRecords() {
    return Array.from(document.querySelectorAll('.custom-record')).map(record => {
        const name = record.querySelector('.record-name').value.trim();
        const ip = record.querySelector('.record-ip').value.trim();
        const proxy = record.querySelector('.record-proxy').checked;
        return name && ip ? { name, ip, proxy } : null;
    }).filter(record => record);
}

function toggleAllProxies(enable) {
    document.querySelectorAll('input[id^="proxy_"]').forEach(input => {
        if (input.id !== 'proxy_main' || input.checked !== enable) {
            input.checked = enable;
        }
    });
    updateSummary();
}

function checkRequiredFields() {
    const domain = document.getElementById('domain').value;
    const serverIP = document.getElementById('serverIP').value;
    const mailHELO = document.getElementById('mailHELO').value;
    const ptrIP = document.getElementById('ptrIP').value;
    const dkim = document.getElementById('dkim').value;
    const spf = document.getElementById('spf').value;

    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    let isValid = domain && mailHELO && dkim && spf && domainRegex.test(domain);
    isValid = isValid && serverIP && ipRegex.test(serverIP);
    isValid = isValid && ptrIP && ipRegex.test(ptrIP);

    document.querySelectorAll('.custom-record').forEach(record => {
        const name = record.querySelector('.record-name').value.trim();
        const ip = record.querySelector('.record-ip').value.trim();
        if (name || ip) {
            isValid = isValid && name && ip && ipRegex.test(ip);
        }
    });

    document.getElementById('gerarDNSBtn').disabled = !isValid;
    return isValid;
}

async function updateSummary() {
    const domain = document.getElementById('domain').value;
    const serverIP = document.getElementById('serverIP').value;
    document.getElementById('summary-basic').innerHTML = `
        <p>Domínio: ${domain || '<em>Não definido</em>'}</p>
        <p>IP do Servidor: ${serverIP || '<em>Não definido</em>'}</p>
    `;

    const mailHELO = document.getElementById('mailHELO').value;
    const ptrIP = document.getElementById('ptrIP').value;
    document.getElementById('summary-email').innerHTML = `
        <p>Mail HELO: ${mailHELO || '<em>Não definido</em>'}</p>
        <p>IP da Entrada PTR: ${ptrIP || '<em>Não definido</em>'}</p>
    `;

    const dkim = document.getElementById('dkim').value;
    const spf = document.getElementById('spf').value;
    document.getElementById('summary-security').innerHTML = `
        <p>DKIM: ${dkim ? 'Configurado' : '<em>Não definido</em>'}</p>
        <p>SPF: ${spf ? 'Configurado' : '<em>Não definido</em>'}</p>
    `;

    const records = getCustomRecords();
    const recordsHtml = records.length ? await Promise.all(records.map(async record => {
        let flagHtml = '';
        try {
            const response = await fetch(`https://ipwhois.app/json/${record.ip}?lang=pt`);
            const data = await response.json();
            if (data.country_code) {
                const countryCode = data.country_code.toLowerCase();
                flagHtml = `<img class="record-flag" src="https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${countryCode}.svg" 
                           onerror="this.onerror=null; this.src='https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode.toUpperCase()}.svg'" 
                           alt="">`;
            }
        } catch (error) {
            console.error('Erro ao buscar bandeira:', error);
        }
        
        const truncatedName = record.name.length > 10 ? record.name.substring(0, 10) + '...' : record.name;
        return `<div class="record-status-item">
            <span class="record-name">
                ${flagHtml}
                <span class="record-text">${truncatedName} → ${record.ip}</span>
            </span>
            <span class="proxy-tag ${record.proxy ? 'active' : 'inactive'}">
                ${record.proxy ? 'Proxy Ativo' : 'Proxy Inativo'}
            </span>
        </div>`;
    })).then(results => results.join('')) : '<div class="record-status-item"><em>Nenhum registo personalizado</em></div>';
    document.getElementById('summary-records').innerHTML = recordsHtml;

    const proxyNames = {
        main: 'Domínio Principal',
        cpanel: 'cPanel',
        ftp: 'FTP',
        mail: 'Mail',
        webmail: 'Webmail',
        webdisk: 'Webdisk',
        cpcontacts: 'Contatos cPanel',
        cpcalendars: 'Calendário cPanel',
        autodiscover: 'Autodiscover',
        autoconfig: 'Autoconfig'
    };

    const proxyConfigs = ['main', 'cpanel', 'ftp', 'mail', 'webmail', 'webdisk', 'cpcontacts', 'cpcalendars', 'autodiscover', 'autoconfig']
        .map(name => {
            const checked = document.getElementById(`proxy_${name}`).checked;
            return `<div class="proxy-status-item">
                <span class="proxy-name">${proxyNames[name]}</span>
                <span class="proxy-tag ${checked ? 'active' : 'inactive'}">
                    ${checked ? 'Proxy Ativo' : 'Proxy Inativo'}
                </span>
            </div>`;
        }).join('');
    document.getElementById('summary-proxy').innerHTML = proxyConfigs;
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('dnsForm');

    const serverIPInput = document.getElementById('serverIP');
    const ptrIPInput = document.getElementById('ptrIP');

    [serverIPInput, ptrIPInput].forEach(input => {
        input.required = true;
        input.addEventListener('input', async (e) => {
            formatIPInput(e.target);
            validateIP(e.target);
            checkRequiredFields();
            await updateSummary();
        });
        input.addEventListener('blur', (e) => validateIP(e.target));
    });

    form.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', async () => {
            checkRequiredFields();
            await updateSummary();
        });
    });

    form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => updateSummary());
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!checkRequiredFields()) {
            return;
        }

        const customRecordsInput = document.createElement('input');
        customRecordsInput.type = 'hidden';
        customRecordsInput.name = 'custom_records';
        customRecordsInput.value = JSON.stringify(getCustomRecords());
        form.appendChild(customRecordsInput);

        form.submit();
    });

    updateSummary();
});
