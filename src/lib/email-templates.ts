export interface EmailTemplateData {
  [key: string]: string | number | boolean | undefined | null;
}

export class EmailTemplates {
  private static getBaseTemplate(content: string, title: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8f9fa;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: black;
             
            text-align: center;
        }
        .logo {
            max-width: 400px;
            height: auto; 
            margin-bottom: 10px;
        }
        .content {
            padding: 40px 30px;
        }
        .content h1 {
            color: #2d3748;
            font-size: 24px;
            margin: 0 0 20px 0;
            font-weight: 600;
        }
        .content h2 {
            color: #4a5568;
            font-size: 20px;
            margin: 25px 0 15px 0;
            font-weight: 500;
        }
        .content p {
            margin: 0 0 15px 0;
            color: #4a5568;
        }
        .content .highlight {
            background-color: #f7fafc;
            padding: 15px;
            border-left: 4px solid black;
            margin: 20px 0;
            border-radius: 0 4px 4px 0;
        }
        .button {
            display: inline-block;
            background: black;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
            transition: transform 0.2s ease;
        }
        .button:hover {
            transform: translateY(-1px);
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 0;
            color: #718096;
            font-size: 14px;
        }
        .footer .social-links {
            margin: 15px 0;
        }
        .footer .social-links a {
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
            font-weight: 500;
        }
        .divider {
            height: 1px;
            background-color: #e2e8f0;
            margin: 20px 0;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
        }
        .info-item {
            background-color: #f7fafc;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        .info-item strong {
            color: #2d3748;
            display: block;
            margin-bottom: 5px;
        }
        .info-item span {
            color: #4a5568;
        }
        @media (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            .content {
                padding: 30px 20px;
            }
            .info-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img src="https://cloka.in/mail-header.jpg" alt="Cloka" class="logo">
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p><strong>Cloka</strong> - Beyond the Line</p>
            <div class="social-links">
                <a href="https://www.cloka.in">Website</a>
                <a href="https://instagram.com/cloka.club">Instagram</a>
                <a href="mailto:support@cloka.in">Support</a>
            </div>
            <p>© 2025 Cloka. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }

  static contactFormSubmission(data: {
    issueType: string;
    contact?: string;
    details: string;
  }): { subject: string; text: string; html: string } {
    const issueTypeMap: { [key: string]: string } = {
      app: "Something with the app",
      community: "Something with the members of the community",
      "during-run": "Something that happened during the run",
      "post-run": "Something that happened post run",
      other: "Everything else",
    };

    const content = `
      <h1>New Contact Form Submission</h1>
      <div class="highlight">
        <p><strong>Issue Type:</strong> ${
          issueTypeMap[data.issueType] || data.issueType
        }</p>
        ${
          data.contact
            ? `<p><strong>Contact:</strong> ${data.contact}</p>`
            : "<p><em>No contact provided</em></p>"
        }
      </div>
      <h2>Details</h2>
      <p>${data.details.replace(/\n/g, "<br>")}</p>
    `;

    return {
      subject: `Contact Form Submission - ${
        issueTypeMap[data.issueType] || data.issueType
      }`,
      text: `Issue Type: ${issueTypeMap[data.issueType] || data.issueType}
${data.contact ? `Contact: ${data.contact}` : "No contact provided"}

Details:
${data.details}`,
      html: this.getBaseTemplate(content, "Contact Form Submission"),
    };
  }

  static volunteerApplication(data: {
    user: {
      name: string;
      email: string;
      phone: string;
      age?: number;
      gender?: string;
      instagramUsername?: string;
    };
    location: string;
    availability: string;
    interests: string;
    experience: string;
    motivation: string;
    skills?: string;
    languages?: string;
    additionalInfo?: string;
  }): { subject: string; text: string; html: string } {
    const content = `
      <h1>New Volunteer Application</h1>
      <div class="info-grid">
        <div class="info-item">
          <strong>Name</strong>
          <span>${data.user.name}</span>
        </div>
        <div class="info-item">
          <strong>Email</strong>
          <span>${data.user.email}</span>
        </div>
        <div class="info-item">
          <strong>Phone</strong>
          <span>${data.user.phone}</span>
        </div>
        <div class="info-item">
          <strong>Age</strong>
          <span>${data.user.age || "Not specified"}</span>
        </div>
        <div class="info-item">
          <strong>Gender</strong>
          <span>${data.user.gender || "Not specified"}</span>
        </div>
        <div class="info-item">
          <strong>Instagram</strong>
          <span>${data.user.instagramUsername || "Not specified"}</span>
        </div>
      </div>
      
      <h2>Application Details</h2>
      <div class="info-grid">
        <div class="info-item">
          <strong>Location</strong>
          <span>${data.location}</span>
        </div>
        <div class="info-item">
          <strong>Availability</strong>
          <span>${data.availability}</span>
        </div>
        <div class="info-item">
          <strong>Interests</strong>
          <span>${data.interests}</span>
        </div>
        <div class="info-item">
          <strong>Experience</strong>
          <span>${data.experience}</span>
        </div>
      </div>
      
      <h2>Motivation</h2>
      <p>${data.motivation}</p>
      
      ${data.skills ? `<h2>Skills</h2><p>${data.skills}</p>` : ""}
      ${data.languages ? `<h2>Languages</h2><p>${data.languages}</p>` : ""}
      ${
        data.additionalInfo
          ? `<h2>Additional Information</h2><p>${data.additionalInfo}</p>`
          : ""
      }
    `;

    return {
      subject: `New Volunteer Application - ${data.user.name}`,
      text: `Name: ${data.user.name}
Email: ${data.user.email}
Phone: ${data.user.phone}
Age: ${data.user.age || "Not specified"}
Gender: ${data.user.gender || "Not specified"}
Instagram: ${data.user.instagramUsername || "Not specified"}

Location: ${data.location}
Availability: ${data.availability}
Interests: ${data.interests}
Experience: ${data.experience}
Motivation: ${data.motivation}
${data.skills ? `Skills: ${data.skills}` : ""}
${data.languages ? `Languages: ${data.languages}` : ""}
${data.additionalInfo ? `Additional Info: ${data.additionalInfo}` : ""}`,
      html: this.getBaseTemplate(content, "Volunteer Application"),
    };
  }

  static partnershipInquiry(data: {
    name: string;
    organizationName: string;
    email: string;
    phone: string;
    links: string;
    cities: string;
    description: string;
    collaborationType: string;
    pastCollaboration?: string;
    collaborationReason?: string;
    additionalInfo?: string;
  }): { subject: string; text: string; html: string } {
    const content = `
      <h1>New Partnership Inquiry</h1>
      <div class="info-grid">
        <div class="info-item">
          <strong>Name</strong>
          <span>${data.name}</span>
        </div>
        <div class="info-item">
          <strong>Organization</strong>
          <span>${data.organizationName}</span>
        </div>
        <div class="info-item">
          <strong>Email</strong>
          <span>${data.email}</span>
        </div>
        <div class="info-item">
          <strong>Phone</strong>
          <span>${data.phone}</span>
        </div>
        <div class="info-item">
          <strong>Links</strong>
          <span>${data.links}</span>
        </div>
        <div class="info-item">
          <strong>Cities</strong>
          <span>${data.cities}</span>
        </div>
      </div>
      
      <h2>Description</h2>
      <p>${data.description}</p>
      
      <h2>Collaboration Details</h2>
      <div class="info-grid">
        <div class="info-item">
          <strong>Collaboration Type</strong>
          <span>${data.collaborationType}</span>
        </div>
        ${
          data.pastCollaboration
            ? `
        <div class="info-item">
          <strong>Past Collaboration</strong>
          <span>${data.pastCollaboration}</span>
        </div>
        `
            : ""
        }
        ${
          data.collaborationReason
            ? `
        <div class="info-item">
          <strong>Collaboration Reason</strong>
          <span>${data.collaborationReason}</span>
        </div>
        `
            : ""
        }
      </div>
      
      ${
        data.additionalInfo
          ? `<h2>Additional Information</h2><p>${data.additionalInfo}</p>`
          : ""
      }
    `;

    return {
      subject: `New Partnership Inquiry - ${data.organizationName}`,
      text: `Name: ${data.name}
Organization: ${data.organizationName}
Email: ${data.email}
Phone: ${data.phone}
Links: ${data.links}
Cities: ${data.cities}
Description: ${data.description}
Collaboration Type: ${data.collaborationType}
${data.pastCollaboration ? `Past Collaboration: ${data.pastCollaboration}` : ""}
${
  data.collaborationReason
    ? `Collaboration Reason: ${data.collaborationReason}`
    : ""
}
${data.additionalInfo ? `Additional Info: ${data.additionalInfo}` : ""}`,
      html: this.getBaseTemplate(content, "Partnership Inquiry"),
    };
  }

  static passwordReset(data: { email: string; resetUrl: string }): {
    subject: string;
    text: string;
    html: string;
  } {
    const content = `
      <h1>Reset Your Password</h1>
      <p>Hello,</p>
      <p>You requested to reset your password for your Cloka account.</p>
      <div class="highlight">
        <p>Please click the button below to reset your password:</p>
        <a href="${data.resetUrl}" class="button">Reset Password</a>
      </div>
      <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
      <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
      <div class="divider"></div>
      <p><small>If the button doesn't work, you can copy and paste this link into your browser:</small></p>
      <p><small style="word-break: break-all; color: #718096;">${data.resetUrl}</small></p>
    `;

    return {
      subject: "Reset Your Password - Cloka",
      text: `To reset your password, click on this link: ${data.resetUrl}`,
      html: this.getBaseTemplate(content, "Reset Your Password"),
    };
  }

  static merchWaitlistConfirmation(data: { name: string }): {
    subject: string;
    text: string;
    html: string;
  } {
    const content = `
      <h1>Welcome to the Cloka Merch Waitlist! 🎉</h1>
      <p>Hi ${data.name},</p>
      <p>Thank you for joining the <strong>Cloka merch waitlist</strong>! We're excited to have you on board.</p>
      
      <div class="highlight">
        <p>We'll notify you as soon as our exclusive running gear becomes available. You'll be among the first to know about:</p>
        <ul>
          <li>🏃‍♂️ Premium running apparel</li>
          <li>🎽 Custom Cloka merchandise</li>
          <li>🎁 Early access to new releases</li>
          <li>💰 Special waitlist member discounts</li>
        </ul>
      </div>
      
      <p>Stay tuned for updates and keep running! 🏃‍♀️</p>
      <p><strong>- Team Cloka</strong></p>
    `;

    return {
      subject: "Cloka Merch Waitlist Confirmation",
      text: `Hi ${data.name},\n\nThank you for joining the Cloka merch waitlist! We'll notify you as soon as our merch is available.\n\n- Team Cloka`,
      html: this.getBaseTemplate(content, "Merch Waitlist Confirmation"),
    };
  }

  static volunteerStatusUpdate(data: {
    name: string;
    status: "approved" | "rejected";
  }): { subject: string; text: string; html: string } {
    const isApproved = data.status === "approved";
    const content = `
      <h1>Volunteer Application ${isApproved ? "Approved" : "Not Approved"}</h1>
      <p>Dear ${data.name},</p>
      
      ${
        isApproved
          ? `
        <div class="highlight">
          <h2>🎉 Congratulations!</h2>
          <p>Your volunteer application with Cloka has been <strong>approved</strong>! Welcome to the Cloka volunteer team.</p>
        </div>
        <p>We're excited to have you join our community of passionate runners and volunteers. You'll be making a real difference in building the running community.</p>
        <p><strong>What's next?</strong></p>
        <ul>
          <li>We will contact you soon with more details about getting started</li>
          <li>You'll receive information about upcoming events and volunteer opportunities</li>
          <li>Join our volunteer community channels for updates and coordination</li>
        </ul>
      `
          : `
        <div class="highlight">
          <p>Your volunteer application with Cloka has been <strong>not approved</strong> at this time.</p>
        </div>
        <p>Thank you for your interest in volunteering with us. While we couldn't move forward with your application right now, we encourage you to:</p>
        <ul>
          <li>Apply again in the future as opportunities arise</li>
          <li>Stay connected with our community through our events</li>
          <li>Continue following our journey on social media</li>
        </ul>
      `
      }
      
      <p>Best regards,<br><strong>The Cloka Team</strong></p>
    `;

    return {
      subject: `Volunteer Application ${
        isApproved ? "Approved" : "Not Approved"
      } - Cloka`,
      text: `Dear ${data.name},

Your volunteer application with Cloka has been ${
        isApproved
          ? "approved! Welcome to the Cloka volunteer team."
          : "not approved at this time."
      }

${
  isApproved
    ? "We will contact you soon with more details about getting started."
    : "Thank you for your interest in volunteering with us. We encourage you to apply again in the future."
}

Best regards,
The Cloka Team`,
      html: this.getBaseTemplate(content, "Volunteer Application Update"),
    };
  }

  static eventApproval(data: {
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    eventDescription: string;
    approvalMessage: string;
    eventId: string;
  }): { subject: string; text: string; html: string } {
    const content = `
      <h1>🎉 Event Registration Approved!</h1>
      <p>Dear ${data.userName},</p>
      
      <div class="highlight">
        <h2>Great news!</h2>
        <p>${data.approvalMessage}</p>
      </div>
      
      <h2>Event Details</h2>
      <div class="info-grid">
        <div class="info-item">
          <strong>Event</strong>
          <span>${data.eventTitle}</span>
        </div>
        <div class="info-item">
          <strong>Date</strong>
          <span>${data.eventDate}</span>
        </div>
        <div class="info-item">
          <strong>Time</strong>
          <span>${data.eventTime}</span>
        </div>
        <div class="info-item">
          <strong>Location</strong>
          <span>${data.eventLocation}</span>
        </div>
      </div>
      
      ${
        data.eventDescription
          ? `
        <h2>About This Event</h2>
        <p>${data.eventDescription}</p>
      `
          : ""
      }
      
      <div class="highlight">
        <h3>What's Next?</h3>
        <ul>
          <li>📅 Mark your calendar for the event date</li>
          <li>📍 Save the event location</li>
          <li>🏃‍♂️ Get ready for an amazing experience!</li>
          <li>📱 Follow us on Instagram for updates</li>
        </ul>
      </div>
      
      <p>We can't wait to see you there! If you have any questions, feel free to reach out to us.</p>
      
      <p>Best regards,<br><strong>The Cloka Team</strong></p>
    `;

    return {
      subject: `Registration Approved: ${data.eventTitle} - Cloka`,
      text: `Dear ${data.userName},

${data.approvalMessage}

Event Details:
- Event: ${data.eventTitle}
- Date: ${data.eventDate}
- Time: ${data.eventTime}
- Location: ${data.eventLocation}

${data.eventDescription ? `About This Event:\n${data.eventDescription}\n` : ""}

What's Next?
- Mark your calendar for the event date
- Save the event location
- Get ready for an amazing experience!
- Follow us on Instagram for updates

We can't wait to see you there! If you have any questions, feel free to reach out to us.

Best regards,
The Cloka Team`,
      html: this.getBaseTemplate(content, "Event Registration Approved"),
    };
  }
}
