export async function sendMagicCode(email: string, code: string, apiKey: string) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: {
                name: 'Bionic Portal',
                email: 'no-reply@team4909.org'
            },
            to: [{ email }],
            subject: 'Your Login Code',
            htmlContent: `<p>Your login code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send email: ${error}`);
    }

    return response.json();
}
export async function sendEmail(
    to: { email: string; name?: string }[],
    subject: string,
    htmlContent: string,
    apiKey: string
) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: {
                name: 'Bionic Portal',
                email: 'no-reply@team4909.org'
            },
            to,
            subject,
            htmlContent
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send email: ${error}`);
    }

    return response.json();
}
