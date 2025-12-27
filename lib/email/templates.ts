/**
 * Email Template System
 * Inspired by Listmonk - a self-hosted newsletter and mailing list manager
 *
 * This module provides a complete email template management system with:
 * - Template CRUD operations
 * - Variable replacement/rendering
 * - Pre-built templates for common marketing use cases
 * - Category-based organization
 */

import { supabase } from '../supabase';

// =============================================================================
// Types
// =============================================================================

/**
 * Template variable definition for dynamic content
 */
export interface TemplateVariable {
  name: string;
  description: string;
  defaultValue?: string;
  required: boolean;
  type: 'text' | 'html' | 'number' | 'date' | 'url' | 'email';
}

/**
 * Email template category for organization
 */
export type TemplateCategory =
  | 'welcome'
  | 'newsletter'
  | 'promotional'
  | 'transactional'
  | 'event'
  | 'feedback'
  | 'announcement'
  | 'custom';

/**
 * Email template structure
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  category: TemplateCategory;
  variables: TemplateVariable[];
  thumbnail_url: string | null;
  organization_id: string;
  created_by: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Template creation input
 */
export type CreateTemplateInput = Omit<
  EmailTemplate,
  'id' | 'created_at' | 'updated_at' | 'organization_id' | 'created_by'
>;

/**
 * Template update input
 */
export type UpdateTemplateInput = Partial<CreateTemplateInput>;

/**
 * Template rendering result
 */
export interface RenderResult {
  subject: string;
  html: string;
  text: string;
  missingVariables: string[];
}

// =============================================================================
// Pre-built Template Definitions
// =============================================================================

const WELCOME_EMAIL_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to {{company_name}}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logo_url}}" alt="{{company_name}}" style="max-width: 150px; height: auto;">
  </div>

  <h1 style="color: #6366f1; margin-bottom: 20px;">Welcome aboard, {{first_name}}!</h1>

  <p>We're thrilled to have you join the {{company_name}} community. You've made a great decision, and we can't wait to show you what's possible.</p>

  <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <h3 style="margin-top: 0; color: #374151;">Here's what you can do next:</h3>
    <ul style="padding-left: 20px;">
      <li style="margin-bottom: 8px;">Complete your profile setup</li>
      <li style="margin-bottom: 8px;">Explore our features and tools</li>
      <li style="margin-bottom: 8px;">Connect with our community</li>
      <li style="margin-bottom: 8px;">Check out our getting started guide</li>
    </ul>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{cta_url}}" style="display: inline-block; background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">{{cta_text}}</a>
  </div>

  <p>If you have any questions, don't hesitate to reach out. We're here to help!</p>

  <p style="margin-top: 30px;">
    Best regards,<br>
    <strong>The {{company_name}} Team</strong>
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

  <p style="font-size: 12px; color: #6b7280; text-align: center;">
    You're receiving this email because you signed up for {{company_name}}.<br>
    <a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a> | <a href="{{preferences_url}}" style="color: #6b7280;">Email Preferences</a>
  </p>
</body>
</html>
`;

const WELCOME_EMAIL_TEXT = `
Welcome aboard, {{first_name}}!

We're thrilled to have you join the {{company_name}} community. You've made a great decision, and we can't wait to show you what's possible.

Here's what you can do next:
- Complete your profile setup
- Explore our features and tools
- Connect with our community
- Check out our getting started guide

Get Started: {{cta_url}}

If you have any questions, don't hesitate to reach out. We're here to help!

Best regards,
The {{company_name}} Team

---
You're receiving this email because you signed up for {{company_name}}.
Unsubscribe: {{unsubscribe_url}}
`;

const NEWSLETTER_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{newsletter_title}}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="{{logo_url}}" alt="{{company_name}}" style="max-width: 120px; height: auto;">
      <p style="color: #6b7280; margin-top: 10px;">{{newsletter_date}}</p>
    </div>

    <h1 style="color: #111827; font-size: 28px; margin-bottom: 16px; text-align: center;">{{newsletter_title}}</h1>

    <p style="font-size: 18px; color: #4b5563; text-align: center; margin-bottom: 30px;">{{newsletter_subtitle}}</p>

    <div style="margin-bottom: 30px;">
      {{content}}
    </div>

    <!-- Featured Article -->
    <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <h2 style="color: #374151; margin-top: 0;">Featured: {{featured_title}}</h2>
      <p style="color: #4b5563;">{{featured_excerpt}}</p>
      <a href="{{featured_url}}" style="color: #6366f1; font-weight: 600; text-decoration: none;">Read more &rarr;</a>
    </div>

    <!-- Quick Links -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 24px;">
      <h3 style="color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Quick Links</h3>
      <p>
        <a href="{{link1_url}}" style="color: #6366f1; text-decoration: none; margin-right: 16px;">{{link1_text}}</a>
        <a href="{{link2_url}}" style="color: #6366f1; text-decoration: none; margin-right: 16px;">{{link2_text}}</a>
        <a href="{{link3_url}}" style="color: #6366f1; text-decoration: none;">{{link3_text}}</a>
      </p>
    </div>
  </div>

  <div style="text-align: center; padding: 20px;">
    <p style="font-size: 12px; color: #6b7280;">
      {{company_name}} | {{company_address}}<br>
      <a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a> | <a href="{{preferences_url}}" style="color: #6b7280;">Preferences</a> | <a href="{{website_url}}" style="color: #6b7280;">Website</a>
    </p>
  </div>
</body>
</html>
`;

const NEWSLETTER_TEXT = `
{{company_name}} Newsletter
{{newsletter_date}}

# {{newsletter_title}}

{{newsletter_subtitle}}

{{content}}

---

FEATURED: {{featured_title}}

{{featured_excerpt}}

Read more: {{featured_url}}

---

QUICK LINKS:
- {{link1_text}}: {{link1_url}}
- {{link2_text}}: {{link2_url}}
- {{link3_text}}: {{link3_url}}

---

{{company_name}} | {{company_address}}
Unsubscribe: {{unsubscribe_url}}
Preferences: {{preferences_url}}
Website: {{website_url}}
`;

const PRODUCT_ANNOUNCEMENT_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{product_name}} - {{announcement_type}}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logo_url}}" alt="{{company_name}}" style="max-width: 120px; height: auto;">
  </div>

  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 40px; text-align: center; margin-bottom: 30px;">
    <p style="color: rgba(255,255,255,0.8); margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">{{announcement_type}}</p>
    <h1 style="color: white; margin: 0; font-size: 32px;">{{product_name}}</h1>
  </div>

  <p style="font-size: 18px; color: #374151;">Hi {{first_name}},</p>

  <p style="font-size: 18px; color: #374151;">{{intro_text}}</p>

  <div style="margin: 30px 0;">
    <img src="{{product_image_url}}" alt="{{product_name}}" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
  </div>

  <h2 style="color: #111827;">Key Features</h2>

  <div style="margin-bottom: 24px;">
    {{features_html}}
  </div>

  <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <p style="color: #92400e; margin: 0; font-weight: 600;">{{special_offer}}</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{cta_url}}" style="display: inline-block; background-color: #6366f1; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px;">{{cta_text}}</a>
  </div>

  <p style="color: #6b7280; font-size: 14px;">Questions? Reply to this email or contact us at {{support_email}}.</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

  <p style="font-size: 12px; color: #6b7280; text-align: center;">
    {{company_name}} | {{company_address}}<br>
    <a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a>
  </p>
</body>
</html>
`;

const PRODUCT_ANNOUNCEMENT_TEXT = `
{{announcement_type}}: {{product_name}}

Hi {{first_name}},

{{intro_text}}

KEY FEATURES:
{{features_text}}

{{special_offer}}

{{cta_text}}: {{cta_url}}

Questions? Contact us at {{support_email}}.

---

{{company_name}} | {{company_address}}
Unsubscribe: {{unsubscribe_url}}
`;

const PROMOTIONAL_OFFER_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{offer_title}}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="{{logo_url}}" alt="{{company_name}}" style="max-width: 100px; height: auto;">
  </div>

  <div style="background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); border-radius: 12px; padding: 40px; text-align: center; margin-bottom: 30px;">
    <p style="color: rgba(255,255,255,0.9); margin: 0 0 10px 0; font-size: 16px; text-transform: uppercase; letter-spacing: 2px;">Limited Time Offer</p>
    <h1 style="color: white; margin: 0; font-size: 48px; font-weight: 800;">{{discount_amount}}</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">{{offer_title}}</p>
  </div>

  <p>Hey {{first_name}},</p>

  <p>{{offer_description}}</p>

  <div style="background-color: #fef2f2; border: 2px dashed #ef4444; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Use code:</p>
    <p style="margin: 0; font-size: 28px; font-weight: 800; color: #ef4444; letter-spacing: 2px;">{{promo_code}}</p>
  </div>

  <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <div style="display: flex; align-items: center; margin-bottom: 16px;">
      <span style="font-size: 24px; margin-right: 12px;">&#9200;</span>
      <div>
        <p style="margin: 0; font-weight: 600; color: #374151;">Offer expires:</p>
        <p style="margin: 0; color: #ef4444; font-weight: 600;">{{expiry_date}}</p>
      </div>
    </div>
    <p style="margin: 0; font-size: 14px; color: #6b7280;">{{terms_conditions}}</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{cta_url}}" style="display: inline-block; background-color: #ef4444; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; text-transform: uppercase;">{{cta_text}}</a>
  </div>

  <p style="color: #6b7280; font-size: 14px; text-align: center;">Don't miss out - this deal won't last long!</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

  <p style="font-size: 12px; color: #6b7280; text-align: center;">
    {{company_name}} | {{company_address}}<br>
    <a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a> | <a href="{{preferences_url}}" style="color: #6b7280;">Email Preferences</a>
  </p>
</body>
</html>
`;

const PROMOTIONAL_OFFER_TEXT = `
LIMITED TIME OFFER: {{discount_amount}}

{{offer_title}}

Hey {{first_name}},

{{offer_description}}

Use code: {{promo_code}}

Offer expires: {{expiry_date}}

{{terms_conditions}}

{{cta_text}}: {{cta_url}}

Don't miss out - this deal won't last long!

---

{{company_name}} | {{company_address}}
Unsubscribe: {{unsubscribe_url}}
`;

const EVENT_INVITATION_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited: {{event_name}}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logo_url}}" alt="{{company_name}}" style="max-width: 120px; height: auto;">
  </div>

  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 40px; text-align: center; margin-bottom: 30px;">
    <p style="color: rgba(255,255,255,0.8); margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">You're Invited</p>
    <h1 style="color: white; margin: 0; font-size: 28px;">{{event_name}}</h1>
  </div>

  <p>Hi {{first_name}},</p>

  <p>{{invitation_message}}</p>

  <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0;">
    <h3 style="margin: 0 0 16px 0; color: #374151;">Event Details</h3>

    <div style="margin-bottom: 16px;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">DATE & TIME</p>
      <p style="margin: 4px 0 0 0; font-weight: 600; color: #111827;">{{event_date}} at {{event_time}}</p>
    </div>

    <div style="margin-bottom: 16px;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">LOCATION</p>
      <p style="margin: 4px 0 0 0; font-weight: 600; color: #111827;">{{event_location}}</p>
    </div>

    <div>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">HOSTED BY</p>
      <p style="margin: 4px 0 0 0; font-weight: 600; color: #111827;">{{host_name}}</p>
    </div>
  </div>

  <div style="margin: 24px 0;">
    <h3 style="color: #374151;">What to Expect</h3>
    <p>{{event_description}}</p>
  </div>

  <div style="background-color: #ecfdf5; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <p style="margin: 0; color: #065f46;">{{special_note}}</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{rsvp_url}}" style="display: inline-block; background-color: #10b981; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px; margin-right: 12px;">RSVP Yes</a>
    <a href="{{decline_url}}" style="display: inline-block; background-color: #e5e7eb; color: #374151; padding: 16px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Can't Make It</a>
  </div>

  <p style="color: #6b7280; font-size: 14px; text-align: center;">
    <a href="{{calendar_url}}" style="color: #6366f1;">Add to Calendar</a> |
    <a href="{{share_url}}" style="color: #6366f1;">Share with Friends</a>
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

  <p style="font-size: 12px; color: #6b7280; text-align: center;">
    {{company_name}} | {{company_address}}<br>
    <a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a>
  </p>
</body>
</html>
`;

const EVENT_INVITATION_TEXT = `
YOU'RE INVITED: {{event_name}}

Hi {{first_name}},

{{invitation_message}}

EVENT DETAILS:
Date & Time: {{event_date}} at {{event_time}}
Location: {{event_location}}
Hosted by: {{host_name}}

WHAT TO EXPECT:
{{event_description}}

{{special_note}}

RSVP Yes: {{rsvp_url}}
Can't Make It: {{decline_url}}
Add to Calendar: {{calendar_url}}

---

{{company_name}} | {{company_address}}
Unsubscribe: {{unsubscribe_url}}
`;

const FEEDBACK_REQUEST_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We'd Love Your Feedback</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logo_url}}" alt="{{company_name}}" style="max-width: 120px; height: auto;">
  </div>

  <h1 style="color: #111827; text-align: center; margin-bottom: 10px;">We'd Love Your Feedback</h1>
  <p style="color: #6b7280; text-align: center; margin-bottom: 30px;">Help us serve you better</p>

  <p>Hi {{first_name}},</p>

  <p>{{intro_message}}</p>

  <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
    <p style="margin: 0 0 16px 0; font-weight: 600; color: #374151;">How would you rate your experience?</p>
    <div style="display: inline-block;">
      <a href="{{rating_1_url}}" style="display: inline-block; width: 40px; height: 40px; line-height: 40px; text-align: center; font-size: 24px; text-decoration: none; margin: 0 4px;">&#128542;</a>
      <a href="{{rating_2_url}}" style="display: inline-block; width: 40px; height: 40px; line-height: 40px; text-align: center; font-size: 24px; text-decoration: none; margin: 0 4px;">&#128533;</a>
      <a href="{{rating_3_url}}" style="display: inline-block; width: 40px; height: 40px; line-height: 40px; text-align: center; font-size: 24px; text-decoration: none; margin: 0 4px;">&#128528;</a>
      <a href="{{rating_4_url}}" style="display: inline-block; width: 40px; height: 40px; line-height: 40px; text-align: center; font-size: 24px; text-decoration: none; margin: 0 4px;">&#128578;</a>
      <a href="{{rating_5_url}}" style="display: inline-block; width: 40px; height: 40px; line-height: 40px; text-align: center; font-size: 24px; text-decoration: none; margin: 0 4px;">&#128525;</a>
    </div>
  </div>

  <div style="margin: 24px 0;">
    <h3 style="color: #374151;">We want to know:</h3>
    <ul style="color: #4b5563;">
      <li style="margin-bottom: 8px;">{{question_1}}</li>
      <li style="margin-bottom: 8px;">{{question_2}}</li>
      <li style="margin-bottom: 8px;">{{question_3}}</li>
    </ul>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{survey_url}}" style="display: inline-block; background-color: #6366f1; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">Take the Survey ({{survey_time}})</a>
  </div>

  <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
    <p style="margin: 0; color: #92400e;">{{incentive_message}}</p>
  </div>

  <p style="color: #6b7280; font-size: 14px;">Your feedback helps us improve. Thank you for being part of our community!</p>

  <p style="margin-top: 24px;">
    Best,<br>
    <strong>{{sender_name}}</strong><br>
    <span style="color: #6b7280;">{{sender_title}}</span>
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

  <p style="font-size: 12px; color: #6b7280; text-align: center;">
    {{company_name}} | {{company_address}}<br>
    <a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a>
  </p>
</body>
</html>
`;

const FEEDBACK_REQUEST_TEXT = `
WE'D LOVE YOUR FEEDBACK

Hi {{first_name}},

{{intro_message}}

How would you rate your experience?
1 - Very Dissatisfied: {{rating_1_url}}
2 - Dissatisfied: {{rating_2_url}}
3 - Neutral: {{rating_3_url}}
4 - Satisfied: {{rating_4_url}}
5 - Very Satisfied: {{rating_5_url}}

We want to know:
- {{question_1}}
- {{question_2}}
- {{question_3}}

Take the full survey ({{survey_time}}): {{survey_url}}

{{incentive_message}}

Your feedback helps us improve. Thank you for being part of our community!

Best,
{{sender_name}}
{{sender_title}}

---

{{company_name}} | {{company_address}}
Unsubscribe: {{unsubscribe_url}}
`;

// =============================================================================
// Pre-built Template Definitions Array
// =============================================================================

export const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at' | 'organization_id' | 'created_by'>[] = [
  {
    name: 'Welcome Email',
    subject: 'Welcome to {{company_name}}, {{first_name}}!',
    html_content: WELCOME_EMAIL_HTML,
    text_content: WELCOME_EMAIL_TEXT,
    category: 'welcome',
    is_default: true,
    thumbnail_url: null,
    variables: [
      { name: 'first_name', description: 'Recipient first name', required: true, type: 'text' },
      { name: 'company_name', description: 'Your company name', required: true, type: 'text' },
      { name: 'logo_url', description: 'Company logo URL', required: false, type: 'url', defaultValue: '' },
      { name: 'cta_url', description: 'Call to action button URL', required: true, type: 'url' },
      { name: 'cta_text', description: 'Call to action button text', required: true, type: 'text', defaultValue: 'Get Started' },
      { name: 'unsubscribe_url', description: 'Unsubscribe link', required: true, type: 'url' },
      { name: 'preferences_url', description: 'Email preferences link', required: false, type: 'url' },
    ],
  },
  {
    name: 'Newsletter',
    subject: '{{newsletter_title}} - {{newsletter_date}}',
    html_content: NEWSLETTER_HTML,
    text_content: NEWSLETTER_TEXT,
    category: 'newsletter',
    is_default: true,
    thumbnail_url: null,
    variables: [
      { name: 'newsletter_title', description: 'Newsletter title/headline', required: true, type: 'text' },
      { name: 'newsletter_subtitle', description: 'Newsletter subtitle', required: false, type: 'text' },
      { name: 'newsletter_date', description: 'Newsletter date', required: true, type: 'date' },
      { name: 'company_name', description: 'Your company name', required: true, type: 'text' },
      { name: 'logo_url', description: 'Company logo URL', required: false, type: 'url' },
      { name: 'content', description: 'Main newsletter content (HTML)', required: true, type: 'html' },
      { name: 'featured_title', description: 'Featured article title', required: false, type: 'text' },
      { name: 'featured_excerpt', description: 'Featured article excerpt', required: false, type: 'text' },
      { name: 'featured_url', description: 'Featured article URL', required: false, type: 'url' },
      { name: 'link1_text', description: 'Quick link 1 text', required: false, type: 'text' },
      { name: 'link1_url', description: 'Quick link 1 URL', required: false, type: 'url' },
      { name: 'link2_text', description: 'Quick link 2 text', required: false, type: 'text' },
      { name: 'link2_url', description: 'Quick link 2 URL', required: false, type: 'url' },
      { name: 'link3_text', description: 'Quick link 3 text', required: false, type: 'text' },
      { name: 'link3_url', description: 'Quick link 3 URL', required: false, type: 'url' },
      { name: 'company_address', description: 'Company address', required: true, type: 'text' },
      { name: 'unsubscribe_url', description: 'Unsubscribe link', required: true, type: 'url' },
      { name: 'preferences_url', description: 'Email preferences link', required: false, type: 'url' },
      { name: 'website_url', description: 'Website URL', required: false, type: 'url' },
    ],
  },
  {
    name: 'Product Announcement',
    subject: '{{announcement_type}}: Introducing {{product_name}}',
    html_content: PRODUCT_ANNOUNCEMENT_HTML,
    text_content: PRODUCT_ANNOUNCEMENT_TEXT,
    category: 'announcement',
    is_default: true,
    thumbnail_url: null,
    variables: [
      { name: 'first_name', description: 'Recipient first name', required: true, type: 'text' },
      { name: 'product_name', description: 'Product name', required: true, type: 'text' },
      { name: 'announcement_type', description: 'Type (New, Update, etc)', required: true, type: 'text', defaultValue: 'New' },
      { name: 'company_name', description: 'Your company name', required: true, type: 'text' },
      { name: 'logo_url', description: 'Company logo URL', required: false, type: 'url' },
      { name: 'intro_text', description: 'Introduction text', required: true, type: 'text' },
      { name: 'product_image_url', description: 'Product image URL', required: false, type: 'url' },
      { name: 'features_html', description: 'Features list (HTML)', required: true, type: 'html' },
      { name: 'features_text', description: 'Features list (text)', required: true, type: 'text' },
      { name: 'special_offer', description: 'Special offer text', required: false, type: 'text' },
      { name: 'cta_url', description: 'Call to action URL', required: true, type: 'url' },
      { name: 'cta_text', description: 'Call to action text', required: true, type: 'text', defaultValue: 'Learn More' },
      { name: 'support_email', description: 'Support email address', required: true, type: 'email' },
      { name: 'company_address', description: 'Company address', required: true, type: 'text' },
      { name: 'unsubscribe_url', description: 'Unsubscribe link', required: true, type: 'url' },
    ],
  },
  {
    name: 'Promotional Offer',
    subject: '{{discount_amount}} OFF - {{offer_title}}',
    html_content: PROMOTIONAL_OFFER_HTML,
    text_content: PROMOTIONAL_OFFER_TEXT,
    category: 'promotional',
    is_default: true,
    thumbnail_url: null,
    variables: [
      { name: 'first_name', description: 'Recipient first name', required: true, type: 'text' },
      { name: 'offer_title', description: 'Offer title', required: true, type: 'text' },
      { name: 'discount_amount', description: 'Discount (e.g., 25% or $50)', required: true, type: 'text' },
      { name: 'offer_description', description: 'Offer description', required: true, type: 'text' },
      { name: 'promo_code', description: 'Promo code', required: true, type: 'text' },
      { name: 'expiry_date', description: 'Offer expiration date', required: true, type: 'date' },
      { name: 'terms_conditions', description: 'Terms and conditions', required: false, type: 'text' },
      { name: 'company_name', description: 'Your company name', required: true, type: 'text' },
      { name: 'logo_url', description: 'Company logo URL', required: false, type: 'url' },
      { name: 'cta_url', description: 'Shop now URL', required: true, type: 'url' },
      { name: 'cta_text', description: 'Button text', required: true, type: 'text', defaultValue: 'Shop Now' },
      { name: 'company_address', description: 'Company address', required: true, type: 'text' },
      { name: 'unsubscribe_url', description: 'Unsubscribe link', required: true, type: 'url' },
      { name: 'preferences_url', description: 'Email preferences link', required: false, type: 'url' },
    ],
  },
  {
    name: 'Event Invitation',
    subject: "You're Invited: {{event_name}}",
    html_content: EVENT_INVITATION_HTML,
    text_content: EVENT_INVITATION_TEXT,
    category: 'event',
    is_default: true,
    thumbnail_url: null,
    variables: [
      { name: 'first_name', description: 'Recipient first name', required: true, type: 'text' },
      { name: 'event_name', description: 'Event name', required: true, type: 'text' },
      { name: 'invitation_message', description: 'Personal invitation message', required: true, type: 'text' },
      { name: 'event_date', description: 'Event date', required: true, type: 'date' },
      { name: 'event_time', description: 'Event time', required: true, type: 'text' },
      { name: 'event_location', description: 'Event location/venue', required: true, type: 'text' },
      { name: 'host_name', description: 'Host name', required: true, type: 'text' },
      { name: 'event_description', description: 'Event description', required: true, type: 'text' },
      { name: 'special_note', description: 'Special note or reminder', required: false, type: 'text' },
      { name: 'company_name', description: 'Your company name', required: true, type: 'text' },
      { name: 'logo_url', description: 'Company logo URL', required: false, type: 'url' },
      { name: 'rsvp_url', description: 'RSVP Yes URL', required: true, type: 'url' },
      { name: 'decline_url', description: 'Decline URL', required: true, type: 'url' },
      { name: 'calendar_url', description: 'Add to calendar URL', required: false, type: 'url' },
      { name: 'share_url', description: 'Share event URL', required: false, type: 'url' },
      { name: 'company_address', description: 'Company address', required: true, type: 'text' },
      { name: 'unsubscribe_url', description: 'Unsubscribe link', required: true, type: 'url' },
    ],
  },
  {
    name: 'Feedback Request',
    subject: "{{first_name}}, we'd love your feedback",
    html_content: FEEDBACK_REQUEST_HTML,
    text_content: FEEDBACK_REQUEST_TEXT,
    category: 'feedback',
    is_default: true,
    thumbnail_url: null,
    variables: [
      { name: 'first_name', description: 'Recipient first name', required: true, type: 'text' },
      { name: 'intro_message', description: 'Introduction message', required: true, type: 'text' },
      { name: 'rating_1_url', description: 'Rating 1 URL', required: true, type: 'url' },
      { name: 'rating_2_url', description: 'Rating 2 URL', required: true, type: 'url' },
      { name: 'rating_3_url', description: 'Rating 3 URL', required: true, type: 'url' },
      { name: 'rating_4_url', description: 'Rating 4 URL', required: true, type: 'url' },
      { name: 'rating_5_url', description: 'Rating 5 URL', required: true, type: 'url' },
      { name: 'question_1', description: 'Survey question 1', required: false, type: 'text' },
      { name: 'question_2', description: 'Survey question 2', required: false, type: 'text' },
      { name: 'question_3', description: 'Survey question 3', required: false, type: 'text' },
      { name: 'survey_url', description: 'Full survey URL', required: true, type: 'url' },
      { name: 'survey_time', description: 'Time to complete survey', required: true, type: 'text', defaultValue: '2 min' },
      { name: 'incentive_message', description: 'Incentive message', required: false, type: 'text' },
      { name: 'sender_name', description: 'Sender name', required: true, type: 'text' },
      { name: 'sender_title', description: 'Sender title', required: true, type: 'text' },
      { name: 'company_name', description: 'Your company name', required: true, type: 'text' },
      { name: 'logo_url', description: 'Company logo URL', required: false, type: 'url' },
      { name: 'company_address', description: 'Company address', required: true, type: 'text' },
      { name: 'unsubscribe_url', description: 'Unsubscribe link', required: true, type: 'url' },
    ],
  },
];

// =============================================================================
// EmailTemplateManager Class
// =============================================================================

/**
 * Email Template Manager
 * Provides CRUD operations for email templates with Supabase persistence
 */
export class EmailTemplateManager {
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  /**
   * Get all templates, optionally filtered by category
   */
  async getTemplates(category?: TemplateCategory): Promise<EmailTemplate[]> {
    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('organization_id', this.organizationId)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as EmailTemplate[];
  }

  /**
   * Get a single template by ID
   */
  async getTemplate(id: string): Promise<EmailTemplate | null> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .eq('organization_id', this.organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data as EmailTemplate;
  }

  /**
   * Create a new template
   */
  async createTemplate(template: CreateTemplateInput): Promise<EmailTemplate> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const insertData = {
      ...template,
      organization_id: this.organizationId,
      created_by: userData.user.id,
      variables: JSON.stringify(template.variables),
    };

    const { data, error } = await (supabase
      .from('email_templates') as any)
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // Parse variables back to array
    const result = data as EmailTemplate;
    if (typeof result.variables === 'string') {
      result.variables = JSON.parse(result.variables);
    }

    return result;
  }

  /**
   * Update an existing template
   */
  async updateTemplate(id: string, updates: UpdateTemplateInput): Promise<EmailTemplate> {
    const updateData: Record<string, unknown> = { ...updates };

    // Convert variables to JSON string if provided
    if (updates.variables) {
      updateData.variables = JSON.stringify(updates.variables);
    }

    const { data, error } = await (supabase
      .from('email_templates') as any)
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', this.organizationId)
      .select()
      .single();

    if (error) throw error;

    // Parse variables back to array
    const result = data as EmailTemplate;
    if (typeof result.variables === 'string') {
      result.variables = JSON.parse(result.variables);
    }

    return result;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id)
      .eq('organization_id', this.organizationId);

    if (error) throw error;
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(id: string): Promise<EmailTemplate> {
    const original = await this.getTemplate(id);
    if (!original) throw new Error('Template not found');

    const duplicateData: CreateTemplateInput = {
      name: `${original.name} (Copy)`,
      subject: original.subject,
      html_content: original.html_content,
      text_content: original.text_content,
      category: original.category,
      variables: original.variables,
      thumbnail_url: original.thumbnail_url,
      is_default: false,
    };

    return this.createTemplate(duplicateData);
  }

  /**
   * Render a template with variable substitution
   */
  async renderTemplate(
    templateId: string,
    variables: Record<string, string>
  ): Promise<RenderResult> {
    const template = await this.getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    return this.renderTemplateContent(template, variables);
  }

  /**
   * Render template content with variable substitution (no DB call)
   */
  renderTemplateContent(
    template: EmailTemplate | CreateTemplateInput,
    variables: Record<string, string>
  ): RenderResult {
    const missingVariables: string[] = [];

    // Check for missing required variables
    for (const variable of template.variables) {
      if (variable.required && !variables[variable.name] && !variable.defaultValue) {
        missingVariables.push(variable.name);
      }
    }

    // Create a map with defaults
    const variableMap: Record<string, string> = {};
    for (const variable of template.variables) {
      variableMap[variable.name] = variables[variable.name] || variable.defaultValue || '';
    }

    // Add any extra variables not defined in template
    for (const [key, value] of Object.entries(variables)) {
      if (!(key in variableMap)) {
        variableMap[key] = value;
      }
    }

    // Replace placeholders
    const replaceVariables = (content: string): string => {
      return content.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return variableMap[varName] !== undefined ? variableMap[varName] : match;
      });
    };

    return {
      subject: replaceVariables(template.subject),
      html: replaceVariables(template.html_content),
      text: replaceVariables(template.text_content),
      missingVariables,
    };
  }

  /**
   * Get all unique categories from templates
   */
  async getCategories(): Promise<TemplateCategory[]> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('category')
      .eq('organization_id', this.organizationId);

    if (error) throw error;

    const categories: TemplateCategory[] = [];
    const seen = new Map<TemplateCategory, boolean>();
    for (const row of data || []) {
      const cat = (row as { category: TemplateCategory }).category;
      if (!seen.has(cat)) {
        seen.set(cat, true);
        categories.push(cat);
      }
    }

    return categories.sort();
  }

  /**
   * Initialize default templates for a new organization
   */
  async initializeDefaultTemplates(): Promise<EmailTemplate[]> {
    const createdTemplates: EmailTemplate[] = [];

    for (const template of DEFAULT_TEMPLATES) {
      try {
        const created = await this.createTemplate(template);
        createdTemplates.push(created);
      } catch (error) {
        console.warn(`Failed to create default template: ${template.name}`, error);
      }
    }

    return createdTemplates;
  }

  /**
   * Search templates by name or subject
   */
  async searchTemplates(query: string): Promise<EmailTemplate[]> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('organization_id', this.organizationId)
      .or(`name.ilike.%${query}%,subject.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as EmailTemplate[];
  }

  /**
   * Preview template with sample data
   */
  previewWithSampleData(template: EmailTemplate | CreateTemplateInput): RenderResult {
    const sampleData: Record<string, string> = {};

    for (const variable of template.variables) {
      switch (variable.type) {
        case 'text':
          sampleData[variable.name] = variable.defaultValue || `Sample ${variable.name}`;
          break;
        case 'email':
          sampleData[variable.name] = variable.defaultValue || 'sample@example.com';
          break;
        case 'url':
          sampleData[variable.name] = variable.defaultValue || 'https://example.com';
          break;
        case 'date':
          sampleData[variable.name] = variable.defaultValue || new Date().toLocaleDateString();
          break;
        case 'number':
          sampleData[variable.name] = variable.defaultValue || '100';
          break;
        case 'html':
          sampleData[variable.name] = variable.defaultValue || '<p>Sample HTML content</p>';
          break;
        default:
          sampleData[variable.name] = variable.defaultValue || `{{${variable.name}}}`;
      }
    }

    return this.renderTemplateContent(template, sampleData);
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Extract variable names from template content
 */
export function extractVariables(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables = new Set<string>();
  let match;

  while ((match = regex.exec(content)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}

/**
 * Validate template content
 */
export function validateTemplate(template: CreateTemplateInput): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!template.name?.trim()) {
    errors.push('Template name is required');
  }

  if (!template.subject?.trim()) {
    errors.push('Subject line is required');
  }

  if (!template.html_content?.trim()) {
    errors.push('HTML content is required');
  }

  if (!template.text_content?.trim()) {
    errors.push('Text content is required');
  }

  // Check that all variables in content are defined
  const htmlVars = extractVariables(template.html_content || '');
  const textVars = extractVariables(template.text_content || '');
  const subjectVars = extractVariables(template.subject || '');
  const allVars = [...htmlVars, ...textVars, ...subjectVars];
  const definedVarsMap = new Map<string, boolean>();
  (template.variables || []).forEach((v) => definedVarsMap.set(v.name, true));

  // Track which variables we've already checked
  const checkedVars = new Map<string, boolean>();
  allVars.forEach((varName) => {
    if (!checkedVars.has(varName)) {
      checkedVars.set(varName, true);
      if (!definedVarsMap.has(varName)) {
        errors.push(`Variable "{{${varName}}}" is used but not defined`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Convert HTML to plain text (basic conversion)
 */
export function htmlToPlainText(html: string): string {
  return html
    // Remove style and script tags
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Replace common elements
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    // Remove all remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: TemplateCategory): string {
  const names: Record<TemplateCategory, string> = {
    welcome: 'Welcome',
    newsletter: 'Newsletter',
    promotional: 'Promotional',
    transactional: 'Transactional',
    event: 'Event',
    feedback: 'Feedback',
    announcement: 'Announcement',
    custom: 'Custom',
  };
  return names[category] || category;
}

/**
 * Get all available categories
 */
export function getAllCategories(): TemplateCategory[] {
  return [
    'welcome',
    'newsletter',
    'promotional',
    'transactional',
    'event',
    'feedback',
    'announcement',
    'custom',
  ];
}
