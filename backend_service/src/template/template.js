// backend_service/src/template/template.js

// Generate overdue reminder email template
export const generateOverdueReminderTemplate = (
  fullName,
  overdueBooks,
  reminderType
) => {
  const totalFine = overdueBooks.reduce(
    (sum, book) => sum + (book.calculatedFine || 0),
    0
  );
  const daysOverdue = overdueBooks.reduce(
    (max, book) => Math.max(max, book.daysOverdue || 0),
    0
  );

  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Overdue Book Reminder</title>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .book-list { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .book-item { padding: 15px; border-bottom: 1px solid #eee; }
          .book-item:last-child { border-bottom: none; }
          .fine-amount { color: #e74c3c; font-weight: bold; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; }
          .urgent { background: #f8d7da; border: 1px solid #f5c6cb; }
          .button { display: inline-block; background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${config.webName} Library</h1>
          <h2>Overdue Book${overdueBooks.length > 1 ? "s" : ""} Reminder</h2>
        </div>
        
        <div class="content">
          <p>Dear <strong>${fullName}</strong>,</p>
          
          <p>We're writing to remind you that you have <strong>${
            overdueBooks.length
          } book${overdueBooks.length > 1 ? "s" : ""}</strong> that ${
    overdueBooks.length > 1 ? "are" : "is"
  } currently overdue.</p>
          
          ${
            reminderType === "final"
              ? `
          <div class="warning urgent">
            <h3>⚠️ FINAL NOTICE</h3>
            <p>This is your final reminder. Failure to return the overdue books may result in account suspension and additional penalties.</p>
          </div>
          `
              : reminderType === "second"
              ? `
          <div class="warning">
            <h3>⚠️ Second Reminder</h3>
            <p>This is your second reminder about these overdue books. Please return them immediately to avoid further penalties.</p>
          </div>`
              : ""
          }
          
          <div class="book-list">
            <h3>Overdue Book${overdueBooks.length > 1 ? "s" : ""}:</h3>
            ${overdueBooks
              .map(
                (book) => `
              <div class="book-item">
                <strong>${book.title}</strong> by ${book.author}<br>
                <small>
                  Due Date: ${new Date(book.due_date).toLocaleDateString()} | 
                  Days Overdue: <strong>${book.daysOverdue}</strong> | 
                  Fine: <span class="fine-amount">$${
                    book.calculatedFine || 0
                  }</span>
                </small>
              </div>
            `
              )
              .join("")}
          </div>
          
          ${
            totalFine > 0
              ? `
          <div style="text-align: center; background: #e74c3c; color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Total Outstanding Fine: $${totalFine}</h3>
          </div>
          `
              : ""
          }
          
          <p><strong>Please return the book(s) as soon as possible to:</strong></p>
          <ul>
            <li>Avoid accumulating additional fines</li>
            <li>Allow other members to access these resources</li>
            <li>Maintain your borrowing privileges</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${
              config.frontendUrl
            }/my-books" class="button">View My Borrowed Books</a>
          </div>
          
          <p>If you have already returned the book(s), please disregard this message or contact library staff.</p>
          
          <p>Thank you for your immediate attention to this matter.</p>
        </div>
        
        <div class="footer">
          <p>${config.webName} Library<br>
          ${config.libraryAddress || "Library Address Not Specified"}<br>
          ${config.libraryPhone || ""} | ${config.libraryEmail || ""}</p>
          <p><small>This is an automated message. Please do not reply to this email.</small></p>
        </div>
      </body>
      </html>
    `;
};

// Generate fine notification email template
export const generateFineNotificationTemplate = (fullName, fineDetails) => {
  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fine Notification</title>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .fine-details { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .total-fine { background: #e74c3c; color: white; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${config.webName} Library</h1>
          <h2>Fine Notification</h2>
        </div>
        
        <div class="content">
          <p>Dear <strong>${fullName}</strong>,</p>
          
          <p>A fine has been applied to your library account for overdue book returns.</p>
          
          <div class="total-fine">
            <h2>Total Fine Amount: $${fineDetails.totalAmount}</h2>
          </div>
          
          <div class="fine-details">
            <h3>Fine Details:</h3>
            ${fineDetails.fines
              .map(
                (fine) => `
              <div style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>${fine.bookTitle}</strong><br>
                <small>
                  Due: ${new Date(fine.dueDate).toLocaleDateString()} | 
                  Returned: ${new Date(fine.returnDate).toLocaleDateString()} | 
                  Days Overdue: ${fine.daysOverdue} | 
                  Fine: $${fine.amount}
                </small>
                ${
                  fine.condition && fine.condition !== "good"
                    ? `<br><small>Condition: ${fine.condition} (Damage fine applied)</small>`
                    : ""
                }
              </div>
            `
              )
              .join("")}
          </div>
          
          <p><strong>Payment Information:</strong></p>
          <ul>
            <li>Fines must be paid within 7 days</li>
            <li>Unpaid fines may result in borrowing privileges being suspended</li>
            <li>You can pay fines at the library circulation desk or online</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${
              config.frontendUrl
            }/pay-fines" class="button">Pay Fines Online</a>
          </div>
          
          <p>If you believe this fine has been applied in error, please contact library staff within 3 days.</p>
        </div>
        
        <div class="footer">
          <p>${config.webName} Library<br>
          ${config.libraryAddress || "Library Address Not Specified"}<br>
          ${config.libraryPhone || ""} | ${config.libraryEmail || ""}</p>
        </div>
      </body>
      </html>
    `;
};

// Generate return confirmation email template
export const generateReturnConfirmationTemplate = (fullName, returnDetails) => {
  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Book Return Confirmation</title>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #27ae60 0%, #229954 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-message { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .book-info { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${config.webName} Library</h1>
          <h2>Book Return Confirmation</h2>
        </div>
        
        <div class="content">
          <p>Dear <strong>${fullName}</strong>,</p>
          
          <div class="success-message">
            <h3>✅ Book Successfully Returned</h3>
            <p>Thank you for returning your borrowed book!</p>
          </div>
          
          <div class="book-info">
            <h3>Return Details:</h3>
            <p><strong>Book:</strong> ${returnDetails.bookTitle} by ${
    returnDetails.bookAuthor
  }</p>
            <p><strong>Return Date:</strong> ${new Date(
              returnDetails.returnDate
            ).toLocaleDateString()}</p>
            <p><strong>Condition:</strong> ${
              returnDetails.condition || "Good"
            }</p>
            ${
              returnDetails.fineAmount > 0
                ? `
              <p><strong>Fine Applied:</strong> $${returnDetails.fineAmount}</p>
              ${
                returnDetails.fineWaived
                  ? `<p><strong>Status:</strong> Fine waived by library staff</p>`
                  : ""
              }
            `
                : "<p><strong>Fine Applied:</strong> None</p>"
            }
          </div>
          
          ${
            returnDetails.fineAmount > 0 && !returnDetails.fineWaived
              ? `
          <p><strong>Note:</strong> The fine has been added to your library account. Please pay it at your earliest convenience to maintain your borrowing privileges.</p>
          `
              : ""
          }
          
          <p>We hope you enjoyed the book! Feel free to borrow more books from our collection.</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${
              config.frontendUrl
            }/books" style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Browse More Books
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>${config.webName} Library<br>
          ${config.libraryAddress || "Library Address Not Specified"}<br>
          ${config.libraryPhone || ""} | ${config.libraryEmail || ""}</p>
        </div>
      </body>
      </html>
    `;
};

// Generate payment confirmation email template
export const generatePaymentConfirmationTemplate = (
  fullName,
  paymentDetails
) => {
  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-message { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .payment-details { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${config.webName} Library</h1>
          <h2>Payment Confirmation</h2>
        </div>
        
        <div class="content">
          <p>Dear <strong>${fullName}</strong>,</p>
          
          <div class="success-message">
            <h3>✅ Payment Received Successfully</h3>
            <p>Thank you for your payment!</p>
          </div>
          
          <div class="payment-details">
            <h3>Payment Details:</h3>
            <p><strong>Receipt Number:</strong> ${
              paymentDetails.receiptNumber
            }</p>
            <p><strong>Payment Date:</strong> ${new Date(
              paymentDetails.paymentDate
            ).toLocaleDateString()}</p>
            <p><strong>Payment Method:</strong> ${
              paymentDetails.paymentMethod
            }</p>
            <p><strong>Amount Paid:</strong> $${paymentDetails.amount}</p>
            <p><strong>Remaining Balance:</strong> $${
              paymentDetails.remainingBalance
            }</p>
          </div>
          
          ${
            paymentDetails.remainingBalance === 0
              ? `
          <div style="background: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>🎉 All Fines Cleared!</h3>
            <p>Your library account is now in good standing. All borrowing privileges have been restored.</p>
          </div>
          `
              : `
          <p>You still have an outstanding balance of $${paymentDetails.remainingBalance}. Please clear this amount to restore full borrowing privileges.</p>
          `
          }
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${
              config.frontendUrl
            }/my-account" style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View My Account
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>${config.webName} Library<br>
          ${config.libraryAddress || "Library Address Not Specified"}<br>
          ${config.libraryPhone || ""} | ${config.libraryEmail || ""}</p>
          <p><small>Please keep this email for your records.</small></p>
        </div>
      </body>
      </html>
    `;
};
