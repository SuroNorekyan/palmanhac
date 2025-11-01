# Palmanhac Admin 2FA Setup / Configuração 2FA Palmanhac

Follow the steps below to secure the administration area with Google Authenticator compatible TOTP.

Siga os passos abaixo para proteger a área de administração com TOTP compatível com Google Authenticator.

1. **Open the setup page / Abra a página de configuração**  
   Visit `/admin/2fa/setup` after signing in as the admin user.  
   Visite `/admin/2fa/setup` depois de iniciar sessão como administrador.

2. **Generate the QR code / Gerar o código QR**  
   Click **Generate Setup QR Code** to create a fresh secret and QR image.  
   Clique em **Gerar código QR de configuração** para criar um novo segredo e respetivo QR.

3. **Scan with Google Authenticator / Digitalizar com o Google Authenticator**  
   In Google Authenticator choose “+” → “Scan QR code” and scan the image displayed.  
   Na aplicação Google Authenticator escolha “+” → “Digitalizar código QR” e aponte para a imagem.

4. **Enter the 6-digit code / Introduzir o código de 6 dígitos**  
   Type the current code shown in the app and submit to activate two-factor authentication.  
   Introduza o código apresentado na aplicação e submeta para ativar a autenticação de dois fatores.

5. **Store recovery codes / Guardar códigos de recuperação**  
   Copy the recovery codes to a secure location; each code can only be used once if you lose access to the device.  
   Copie os códigos de recuperação para um local seguro; cada código só pode ser utilizado uma vez se perder acesso ao dispositivo.

6. **Future sign-ins / Próximos acessos**  
   On the next admin login, enter the TOTP code (or an unused recovery code) on `/admin/2fa/challenge`.  
   No próximo acesso de administrador, introduza o código TOTP (ou um código de recuperação não utilizado) em `/admin/2fa/challenge`.

Recovery codes should be rotated whenever the authenticator application is reinstalled or moved to a new device.  
Os códigos de recuperação devem ser regenerados sempre que reinstalar ou migrar a aplicação autenticadora.
