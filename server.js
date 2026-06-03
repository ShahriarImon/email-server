import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// transporter (Gmail SMTP)
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// store file in memory (best for email attachments)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// optional: verify connection
transporter.verify((error, success) => {
  if (error) {
    console.log("SMTP Error:", error);
  } else {
    console.log("SMTP Ready ✅");
  }
});

// Health check API
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running successfully 🚀",
  });
});

app.get("/smtp-test", async (req, res) => {
  try {
    await transporter.verify();
    res.json({ success: true });
  } catch (err) {
    res.json({
      success: false,
      error: err.message,
    });
  }
});

// Download portfolio API
app.get("/download-portfolio", (req, res) => {
  const filePath = path.join(__dirname, "files", "Company Portfolio.pdf");
  res.download(filePath, "ShebaTech_Portfolio.pdf", (err) => {
    if (err) {
      console.error("Error downloading file:", err);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ success: false, message: "Failed to download file" });
      }
    }
  });
});

// API route
app.post("/send-contact", upload.none(), async (req, res) => {
  const { name, email, message, phoneNumber } = req.body || {};

  if (!name || name === " ") {
    return res
      .status(400)
      .json({ success: false, message: "Name is required." });
  }

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required." });
  }

  if (!email.includes("@")) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address.",
    });
  }

  if (!phoneNumber) {
    return res
      .status(400)
      .json({ success: false, message: "Phone number is required." });
  }

  const bdPhoneRegex = /^(?:\+?88|0088)?01[3-9]\d{8}$/;
  if (!bdPhoneRegex.test(phoneNumber)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid Bangladeshi phone number.",
    });
  }

  if (!message) {
    return res
      .status(400)
      .json({ success: false, message: "Message is required." });
  }

  try {
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: "imon.shahriar012@gmail.com, imon.cse.ewu@gmail.com, rabbi0268@gmail.com", // receive on your Gmail
      // to: "info@shebatech.com, sales@shebatech.com.bd, farhan.islam@shebatech.com.bd", // receive on your Gmail
      subject: `New inquiry from ${name}`,

      // 👉 HTML EMAIL
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color:#4CAF50;">New inquiry</h2>
          
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone Number:</strong> ${phoneNumber}</p>
          
          <div style="margin-top:10px;">
            <strong>Message:</strong>
            <p style="background:#f4f4f4;padding:10px;border-radius:5px;">
              ${message}
            </p>
          </div>

          <hr/>
          <p style="font-size:12px;color:gray;">
            Sent from shebatech.com.bd
          </p>
        </div>
      `,
    };

    // Send email asynchronously in the background to prevent 504 Gateway Timeout
    // transporter
    //   .sendMail(mailOptions)
    //   .then(() => console.log(`Contact email sent successfully from ${name}`))
    //   .catch((error) =>
    //     console.error("Background Email Error [/send-contact]:", error),
    //   );
    await transporter.sendMail(mailOptions);
    // Respond immediately to the client
    res.status(200).json({
      success: true,
      message: "Email is being processed and will be sent shortly.",
    });
  } catch (error) {
    console.error("Request Processing Error [/send-contact]:", error);

    res.status(500).json({
      success: false,
      message: "Failed to process the request. Please try again later.",
      error: error.message || "Internal Server Error",
    });
  }
});

app.post("/send-email-with-file", upload.single("file"), async (req, res) => {
  const { name, email, message, phoneNumber } = req.body || {};
  const file = req.file;

  if (!name || name === " ") {
    return res
      .status(400)
      .json({ success: false, message: "Name is required." });
  }

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required." });
  }

  if (!email.includes("@")) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address.",
    });
  }

  if (!phoneNumber) {
    return res
      .status(400)
      .json({ success: false, message: "Phone number is required." });
  }

  const bdPhoneRegex = /^(?:\+?88|0088)?01[3-9]\d{8}$/;
  if (!bdPhoneRegex.test(phoneNumber)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid Bangladeshi phone number.",
    });
  }

  if (!message) {
    return res
      .status(400)
      .json({ success: false, message: "Message is required." });
  }

  if (!file) {
    return res
      .status(400)
      .json({ success: false, message: "Resume is required." });
  }

  try {
    const mailOptions = {
      from: email,
      // to: "info@shebatech.com",
      to: "imon.shahriar012@gmail.com, imon.cse.ewu@gmail.com, rabbi0268@gmail.com", // receive on your Gmail
      // to: "info@shebatech.com", // receive on your Gmail
      subject: `New message from ${name}`,

      html: `
        <h2>New Message</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone Number:</b> ${phoneNumber}</p>
        <p><b>Message:</b> ${message}</p>
      `,

      // ✅ attachment added here
      attachments: file
        ? [
            {
              filename: file.originalname,
              content: file.buffer,
            },
          ]
        : [],
    };

    // Send email asynchronously in the background to prevent 504 Gateway Timeout
    // transporter
    //   .sendMail(mailOptions)
    //   .then(() => console.log(`Email with file sent successfully from ${name}`))
    //   .catch((error) =>
    //     console.error("Background Email Error [/send-email-with-file]:", error),
    //   );

    await transporter.sendMail(mailOptions);

    // Respond immediately to the client
    res.status(200).json({
      success: true,
      message: "Email is being processed and will be sent shortly.",
    });
  } catch (error) {
    console.error("Request Processing Error [/send-email-with-file]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process request. Please try again later.",
      error: error.message || "Internal Server Error",
    });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: "File upload error",
      error: err.message,
    });
  }
  res.status(500).json({
    success: false,
    message: "An unexpected error occurred",
    error: err.message || "Internal Server Error",
  });
});

// start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
