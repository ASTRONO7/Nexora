import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_fD4Ww2ME_H3UXAAoQJDd6wK7RoidPhERc');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { email, type, ...data } = req.body;

    try {
        const { data: emailData, error } = await resend.emails.send({
            from: 'Nexora Contact <onboarding@resend.dev>',
            to: ['team.nexaai@gmail.com'],
            subject: `New ${type} Submission from ${email}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 24px;">New ${type} Submission</h1>
                    <p style="font-size: 16px; margin-bottom: 24px;">
                        <strong>From:</strong> <a href="mailto:${email}" style="color: #0070f3; text-decoration: none;">${email}</a>
                    </p>
                    <div style="background: #f9f9f9; padding: 24px; border-radius: 8px; border: 1px solid #eaeaea;">
                        ${Object.entries(data).map(([key, value]) => `
                            <div style="margin-bottom: 16px;">
                                <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 4px;">${key}</p>
                                <p style="font-size: 16px; margin: 0; color: #333; white-space: pre-wrap;">${value}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `,
        });

        if (error) {
            return res.status(400).json(error);
        }

        res.status(200).json(emailData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
