import { Resend } from "resend";
import { prisma } from "./prisma";
import { formatCurrency, formatDate } from "./utils";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@tourismco.com";

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    // Log email notification
    await prisma.emailNotification.create({
      data: {
        type: "GENERAL",
        subject,
        status: "SENT",
        sentAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    await prisma.emailNotification.create({
      data: {
        type: "GENERAL",
        subject,
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}

export async function sendBookingConfirmationEmail(booking: any): Promise<void> {
  const user = booking.user;
  const guestDetails = booking.guestDetails as any;
  const isFlightBooking = booking.bookingType === "FLIGHT" && booking.flightOfferData;

  const getBookingTitle = () => {
    if (booking.tour) return booking.tour.title;
    if (booking.flight)
      return `${booking.flight.origin} → ${booking.flight.destination}`;
    if (isFlightBooking && booking.flightOfferData) {
      const flightData = booking.flightOfferData as any;
      const outbound = flightData.outbound || flightData;
      const itinerary = outbound?.itineraries?.[0];
      if (itinerary?.segments) {
        const origin = itinerary.segments[0]?.departure?.iataCode;
        const destination = itinerary.segments[itinerary.segments.length - 1]?.arrival?.iataCode;
        if (origin && destination) {
          return `${origin} → ${destination}`;
        }
      }
      return "Flight Booking";
    }
    if (booking.hotel) return booking.hotel.name;
    if (booking.visa)
      return `${booking.visa.country} - ${booking.visa.type} Visa`;
    return "Booking";
  };

  const formatFlightDetails = () => {
    if (!isFlightBooking || !booking.flightOfferData) return "";
    
    const flightData = booking.flightOfferData as any;
    const outbound = flightData.outbound || flightData;
    const returnOffer = flightData.return;
    const itinerary = outbound?.itineraries?.[0];
    
    if (!itinerary?.segments) return "";
    
    const firstSegment = itinerary.segments[0];
    const lastSegment = itinerary.segments[itinerary.segments.length - 1];
    const departureTime = new Date(firstSegment.departure.at).toLocaleString();
    const arrivalTime = new Date(lastSegment.arrival.at).toLocaleString();
    
    let html = `
      <div style="background: #f0f9ff; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #2563eb;">
        <h3 style="margin-top: 0;">Outbound Flight</h3>
        <p><strong>Departure:</strong> ${firstSegment.departure.iataCode} at ${departureTime}</p>
        <p><strong>Arrival:</strong> ${lastSegment.arrival.iataCode} at ${arrivalTime}</p>
        <p><strong>Duration:</strong> ${itinerary.duration}</p>
      </div>
    `;
    
    if (returnOffer) {
      const returnItinerary = returnOffer.itineraries?.[0];
      if (returnItinerary?.segments) {
        const returnFirst = returnItinerary.segments[0];
        const returnLast = returnItinerary.segments[returnItinerary.segments.length - 1];
        const returnDeparture = new Date(returnFirst.departure.at).toLocaleString();
        const returnArrival = new Date(returnLast.arrival.at).toLocaleString();
        
        html += `
          <div style="background: #f0f9ff; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #2563eb;">
            <h3 style="margin-top: 0;">Return Flight</h3>
            <p><strong>Departure:</strong> ${returnFirst.departure.iataCode} at ${returnDeparture}</p>
            <p><strong>Arrival:</strong> ${returnLast.arrival.iataCode} at ${returnArrival}</p>
            <p><strong>Duration:</strong> ${returnItinerary.duration}</p>
          </div>
        `;
      }
    }
    
    return html;
  };

  const formatPassengers = () => {
    if (!isFlightBooking || !guestDetails?.passengers) return "";
    
    const passengers = guestDetails.passengers;
    let html = `<h3 style="margin-top: 20px;">Passengers (${passengers.length})</h3>`;
    
    passengers.forEach((passenger: any, index: number) => {
      html += `
        <div style="background: white; padding: 10px; margin: 10px 0; border-radius: 4px;">
          <p style="margin: 5px 0;"><strong>Passenger ${index + 1}:</strong> ${passenger.title} ${passenger.firstName} ${passenger.lastName}</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">Type: ${passenger.passengerType}${passenger.passportNumber ? ` • Passport: ${passenger.passportNumber}` : ""}</p>
        </div>
      `;
    });
    
    return html;
  };

  const contactEmail = isFlightBooking && guestDetails?.contact?.email 
    ? guestDetails.contact.email 
    : guestDetails?.email || user.email;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p>Dear ${isFlightBooking && guestDetails?.contact ? guestDetails.contact.email : (guestDetails?.firstName || user.name)},</p>
            <p>Your booking has been confirmed. We're excited to have you with us!</p>
            
            <div class="details">
              <h2>Booking Details</h2>
              <p><strong>Booking ID:</strong> ${booking.id}</p>
              <p><strong>Service:</strong> ${getBookingTitle()}</p>
              <p><strong>Booking Date:</strong> ${formatDate(booking.bookingDate)}</p>
              ${booking.travelDate ? `<p><strong>Travel Date:</strong> ${formatDate(booking.travelDate)}</p>` : ""}
              <p><strong>Total Amount:</strong> ${formatCurrency(Number(booking.totalAmount), booking.currency)}</p>
              <p><strong>Status:</strong> ${booking.status}</p>
              
              ${isFlightBooking ? formatFlightDetails() : ""}
              ${isFlightBooking ? formatPassengers() : ""}
            </div>

            ${isFlightBooking ? `
              <div style="background: #fef3c7; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <h3 style="margin-top: 0;">Check-in Information</h3>
                <p>Please arrive at the airport at least 2 hours before your departure time for international flights, and 1 hour for domestic flights.</p>
                <p>Make sure to bring valid travel documents (passport, visa if required) for all passengers.</p>
              </div>
            ` : ""}

            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>Tourism Co Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail(contactEmail, "Booking Confirmation", html);
}

export async function sendPaymentReceiptEmail(booking: any): Promise<void> {
  const user = booking.user;
  const guestDetails = booking.guestDetails as any;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .receipt { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .amount { font-size: 24px; font-weight: bold; color: #10b981; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Receipt</h1>
          </div>
          <div class="content">
            <p>Dear ${guestDetails.firstName || user.name},</p>
            <p>Thank you for your payment. Here's your receipt:</p>
            
            <div class="receipt">
              <h2>Payment Details</h2>
              <p><strong>Transaction ID:</strong> ${booking.paymentTransactionId}</p>
              <p><strong>Booking ID:</strong> ${booking.id}</p>
              <p><strong>Payment Method:</strong> ${booking.paymentMethod}</p>
              <p><strong>Payment Date:</strong> ${formatDate(new Date())}</p>
              <p class="amount">Amount Paid: ${formatCurrency(Number(booking.totalAmount), booking.currency)}</p>
            </div>

            <p>This receipt serves as proof of payment for your records.</p>
            <p>Best regards,<br>Tourism Co Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail(user.email, "Payment Receipt", html);
}

export async function sendAdminNotification(
  type: string,
  subject: string,
  message: string
): Promise<void> {
  // Get admin emails
  const admins = await prisma.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "SUPER_ADMIN"],
      },
    },
    select: {
      email: true,
    },
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .alert { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc2626; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Admin Notification</h1>
          </div>
          <div class="content">
            <div class="alert">
              <h2>${subject}</h2>
              <p>${message}</p>
            </div>
            <p>Please review this in the admin dashboard.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Send to all admins
  await Promise.all(
    admins.map((admin) => sendEmail(admin.email, `[Admin] ${subject}`, html))
  );
}

export async function sendComplaintStatusUpdateEmail(
  complaint: any
): Promise<void> {
  const user = complaint.user;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .status { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Complaint Status Update</h1>
          </div>
          <div class="content">
            <p>Dear ${user.name},</p>
            <p>Your complaint status has been updated:</p>
            
            <div class="status">
              <p><strong>Complaint ID:</strong> ${complaint.id}</p>
              <p><strong>Subject:</strong> ${complaint.subject}</p>
              <p><strong>Status:</strong> ${complaint.status}</p>
              ${complaint.adminResponse ? `<p><strong>Response:</strong> ${complaint.adminResponse}</p>` : ""}
            </div>

            <p>You can view the full details in your account.</p>
            <p>Best regards,<br>Tourism Co Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail(user.email, "Complaint Status Update", html);
}

export async function sendAdminPaymentNotification(booking: any): Promise<void> {
  // Get admin emails
  const admins = await prisma.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "SUPER_ADMIN"],
      },
    },
    select: {
      email: true,
      name: true,
    },
  });

  if (admins.length === 0) {
    console.warn("No admin users found for payment notification");
    return;
  }

  const guestDetails = booking.guestDetails as any;
  const isFlightBooking = booking.bookingType === "FLIGHT" && booking.flightOfferData;
  
  const getBookingTitle = () => {
    if (booking.tour) return booking.tour.title;
    if (isFlightBooking && booking.flightOfferData) {
      const flightData = booking.flightOfferData as any;
      const outbound = flightData.outbound || flightData;
      const itinerary = outbound?.itineraries?.[0];
      if (itinerary?.segments) {
        const origin = itinerary.segments[0]?.departure?.iataCode;
        const destination = itinerary.segments[itinerary.segments.length - 1]?.arrival?.iataCode;
        if (origin && destination) {
          return `${origin} → ${destination}`;
        }
      }
      return "Flight Booking";
    }
    if (booking.hotel) return booking.hotel.name;
    if (booking.visa) return `${booking.visa.country} - ${booking.visa.type} Visa`;
    return "Booking";
  };

  const customerName = isFlightBooking && guestDetails?.contact
    ? `${guestDetails.contact.email}`
    : `${guestDetails?.firstName || ""} ${guestDetails?.lastName || ""}`.trim() || booking.user?.name || "Customer";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
          .amount { font-size: 24px; font-weight: bold; color: #10b981; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 New Payment Received</h1>
          </div>
          <div class="content">
            <p>Dear Admin,</p>
            <p>A new payment has been successfully processed:</p>
            
            <div class="details">
              <h2>Payment Details</h2>
              <p><strong>Booking ID:</strong> ${booking.id}</p>
              <p><strong>Service:</strong> ${getBookingTitle()}</p>
              <p><strong>Customer:</strong> ${customerName}</p>
              <p><strong>Customer Email:</strong> ${isFlightBooking && guestDetails?.contact?.email ? guestDetails.contact.email : (guestDetails?.email || booking.user?.email)}</p>
              <p><strong>Payment Method:</strong> ${booking.paymentMethod || "Unknown"}</p>
              <p><strong>Transaction ID:</strong> ${booking.paymentTransactionId || "N/A"}</p>
              <p><strong>Booking Date:</strong> ${formatDate(booking.bookingDate)}</p>
              ${booking.travelDate ? `<p><strong>Travel Date:</strong> ${formatDate(booking.travelDate)}</p>` : ""}
              <p class="amount">Amount: ${formatCurrency(Number(booking.totalAmount), booking.currency)}</p>
            </div>

            <p>You can view the full booking details in the admin dashboard.</p>
            <p>Best regards,<br>Tourism Co System</p>
          </div>
          <div class="footer">
            <p>This is an automated notification. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Send to all admins
  await Promise.all(
    admins.map((admin) =>
      sendEmail(admin.email, `[Admin] New Payment Received - ${formatCurrency(Number(booking.totalAmount), booking.currency)}`, html)
    )
  );
}

