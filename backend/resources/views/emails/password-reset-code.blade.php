<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Password Reset Code</title>
</head>
<body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:#050918;padding:24px 28px;color:#ffffff;">
              <div style="font-size:22px;font-weight:800;color:#41dff2;">Koryaal</div>
              <div style="font-size:12px;font-weight:700;color:#cbd5e1;margin-top:4px;">Password reset request</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="font-size:15px;line-height:1.6;margin:0 0 14px;">A password reset was requested for this account:</p>
              <p style="font-size:14px;font-weight:700;margin:0 0 22px;color:#334155;">{{ $email }}</p>
              <p style="font-size:15px;line-height:1.6;margin:0 0 14px;">Use this 6-digit code to verify your email:</p>
              <div style="font-size:34px;font-weight:900;letter-spacing:8px;background:#ecfeff;color:#0e7490;border-radius:14px;padding:18px 20px;text-align:center;border:1px solid #bae6fd;">{{ $code }}</div>
              <p style="font-size:13px;line-height:1.6;margin:22px 0 0;color:#64748b;">This code expires in 10 minutes and can be used only once. If you did not request this, you can ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
