import nodemailer from "nodemailer";

export const handler = async () => {
  const transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY,
    },
  });

  const info = await transporter.sendMail({
    from: 'Saint Joseph Catholic Church Contact Form',
    to: "stjosephcatholicchurchbluffton@gmail.com",
    subject: "Hello ✔",
    text: "Hello world?",
    html: "<b>Hello world?</b>",
  });

  if (info.messageId) {
    return {
      statusCode: 200,
      body: nodemailer.getTestMessageUrl(info),
    };
  }

  return {
    statusCode: 400,
    body: "Unable to send contact email",
  };
};
