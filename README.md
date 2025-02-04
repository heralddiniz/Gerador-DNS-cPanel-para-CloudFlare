# Gerador de DNS cPanel para CloudFlare

Este projeto é uma aplicação web que permite gerar registros DNS para domínios utilizando cPanel e CloudFlare. Ele facilita a configuração de registros A, CNAME, MX e TXT, além de permitir a ativação ou desativação do proxy do CloudFlare para diferentes subdomínios.

## Funcionalidades

- **Informações Básicas**: Configuração do domínio e IP do servidor.
- **Configurações de Email**: Configuração de Mail HELO e IP da entrada PTR.
- **Configurações de Segurança**: Configuração de valores DKIM e SPF.
- **Registros A Personalizados**: Adição de registros A personalizados com suporte a proxy do CloudFlare.
- **Configurações do CloudFlare Proxy**: Ativação ou desativação do proxy do CloudFlare para subdomínios específicos.
- **Resumo das Configurações**: Visualização em tempo real das configurações inseridas.

## Tecnologias Utilizadas

- HTML
- CSS
- JavaScript
- PHP

## Como Usar

1. Clone o repositório para sua máquina local:
    ```sh
    git clone https://github.com/seu-usuario/gerador-dns-cpanel-cloudflare.git
    ```

2. Navegue até o diretório do projeto:
    ```sh
    cd gerador-dns-cpanel-cloudflare
    ```

3. Abra o arquivo `index.php` em um servidor web local (por exemplo, usando XAMPP ou WAMP).

4. Preencha o formulário com as informações necessárias:
    - **Informações Básicas**: Domínio e IP do servidor.
    - **Configurações de Email**: Mail HELO e IP da entrada PTR.
    - **Configurações de Segurança**: Valores DKIM e SPF.
    - **Registros A Personalizados**: Adicione registros A personalizados conforme necessário.
    - **Configurações do CloudFlare Proxy**: Ative ou desative o proxy do CloudFlare para os subdomínios desejados.

5. Clique no botão "Gerar DNS" para baixar o arquivo de configuração DNS.

6. Utilize o botão "Limpar" para resetar o formulário e começar uma nova configuração.

## Estrutura do Projeto

- `index.php`: Arquivo principal que contém o formulário e a lógica de geração dos registros DNS.
- `styles.css`: Arquivo de estilos CSS para a interface do usuário.
- `script.js`: Arquivo JavaScript que contém a lógica de validação e atualização dinâmica do formulário.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma issue ou enviar um pull request.

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

```