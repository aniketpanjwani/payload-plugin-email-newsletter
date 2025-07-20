# Broadcast Documentation

*Scraped from https://sendbroadcast.net/docs/*

---

## Introduction

*Source: https://sendbroadcast.net/docs/*

# Documentation

  
    
      
        
      
    
    
      
### Our documentation is currently under construction.

      
        Our documentation is currently under construction, so you may expect missing parts. Need help? Email us at [[email&#160;protected]](/cdn-cgi/l/email-protection#a5d6ccc8cacbe5d6c0cbc1c7d7cac4c1c6c4d6d18bcbc0d19ad6d0c7cfc0c6d198e1cac6d0c8c0cbd1c4d1cccacb85c3c0c0c1c7c4c6ce).
      
    
  

**Welcome to the Broadcast documentation!**

Here is everything you need to know to install and use Broadcast.

If we are missing anything here or if anything is unclear, please email us at [[email&#160;protected]](/cdn-cgi/l/email-protection#2b58424644456b584e454f4959444a4f484a585f05454e5f14585e49414e485f166f44485e464e455f4a5f4244450b4d4e4e4f494a4840).

---

## Terminology

*Source: https://sendbroadcast.net/docs/terminology*

# Terminology

Most of the terminologies used in Broadcast should be familar with users familiar with email marketing.

We will list them here for your reference and what they mean inside the context of the Broadcast application.

## broadcast channel

Also known as **channels**, these are the silos for your subscribers and the emails you send to them.

On other platforms, this is often referred to as a &ldquo;list&rdquo;.

## broadcast emails

Aside from being the name of the software, we refer to **broadcast emails** as the emails that you manually send.

These are typically used for one-time email blasts, such as newsletters, alerts, or promotional emails.

## email sequences

Also known as &ldquo;drip campaigns&rdquo;, **email sequences** are a series of automated emails sent to your subscribers based on a specific schedule or trigger event.

## transactional emails

**Transactional emails** are emails that are sent programmatically triggered through the API.

These are typically used for one-time emails triggered by specific user actions, such as password resets, order confirmations, or shipping notifications.

## subscribers

**Subscribers** are the users who have opted in to receive your emails or you have added manually to your channel.

They are usually collected through a signup form or other opt-in process, or imported manually from an external system.

---

## Setup

*Source: https://sendbroadcast.net/docs/setup*

# Setup

The setup process for Broadcast is straightforward and involves a few simple steps.

## Initial onboarding

When you first install Broadcast, you must go to your installed domain.

Say, for example, you installed Broadcast at `https://broadcast.example.com`, you must go to `https://broadcast.example.com` immediately after installation to set up your administrative account.

Note: Future versions of Broadcast will support multiple administrative users. For the time being, only one user is supported.

Once set up, Broadcast will ask you to confirm the domain it is installed at, and a name for the default [broadcast channel](/docs/terminology).

## Setting up your channel

Before you can begin sending any email messages, you must configure your channel settings.

This includes:

- Sender name and email address (eg. &ldquo;John Doe&rdquo; [[email&#160;protected]](/cdn-cgi/l/email-protection#701a1f181e5e141f15301508111d001c155e131f1d)). All emails sent from this specific channel will appear to come from this sender.

- At least one SMTP server for sending emails.

For SMTP settings, you must provide:

- SMTP server address

- SMTP server port

- SMTP authentication type (None, Login, or CRAM-MD5)

- SMTP username

- SMTP password

- Email types that can be sent from this server (Broadcast, Sequences, and/or Transactional Emails)

Once you have entered your SMTP settings, click on the &ldquo;Test SMTP settings&rdquo; button to verify that your settings are correct. We need to make sure that Broadcast can login to your SMTP server and send emails.

Once you have set up your channel, you can begin sending messages. Broadcast will let you know if any settings are missing or invalid.

---

## Channels

*Source: https://sendbroadcast.net/docs/channels*

# Channels

Channels in Broadcast, also known as a &ldquo;list&rdquo; in other email marketing software, is where you organize your subscribers. From within a channel, you can send three different types of emails:

- Broadcasts (manual email campaigns)

- Sequences (DRIP style automation email sequences)

- Transactional emails via the API (eg. password resets)

## Creating a Channel

By default, your installation requires you to have at least one channel. You can have multiple channels to organize different parts of your business (eg. enterprise customers vs small-medium B2B customers), or different projects altogether.

To create a new channel, click on **Switch Channel** in the upper left corner of the screen.

From there, you will see a link that says **create a new one** to create a new channel.

## Switching Channels

To switch between channels, click on **Switch Channel** in the upper left corner of the screen and select the channel you want.

You can always check which channel you are in by looking at the channel name on the upper left corner of the screen in the sidebar (on the desktop). It will say **Current Channel**.

## Deleting a Channel

To preserve your data, you cannot delete a channel. However, you can deactivate a channel by going to **Channel Settings** and clicking on **Deactivate channel**.

## Understanding how channels work

All settings, subscribers, broadcasts, sequences, and transactional emails are channel-specific. This means that if you have a channel called &ldquo;Enterprise&rdquo;, all of the settings, subscribers, broadcasts, sequences, and transactional emails will only apply to the &ldquo;Enterprise&rdquo; channel.

This allows you to have a separate setup for each of your channels, which is useful if you have different opt-in forms, or want to send different content to different groups of people.

## Email servers

Each channel requires at least one email server. You can have multiple email servers within the same channel, and Broadcast will automatically &ldquo;load balance&rdquo; between them when sending out broadcasts, transactional emails, and sequences (DRIP/autoresponders).

### Adding an email server

To add an email server, navigate to **Channel Settings** -> **Email Servers**. From there, click on the **Add email server** button. This will take you to a page where you can configure the new server.

### Configuring an email server

When adding or editing an email server, you will be presented with several configuration options:

- **Label**: A friendly name for you to identify the server easily. For example, &ldquo;Server at AWS us-east-1&rdquo;.

- **Vendor**: Select your email service provider (ESP) from the list, like AWS SES, Sendgrid, Postmark, etc. Broadcast will use the correct settings for the email service you choose.

- **SMTP Details**: You&rsquo;ll need to provide the SMTP address, port, username, and password for your email server. You can get these details from your ESP. Note that some hosting providers block outgoing traffic on ports 25, 467, or even 587. If your test connection fails, please double check if the port is open.

- **SMTP Authentication**: Select the authentication method used by your SMTP server.

#### Custom Headers

You can add custom headers to all emails sent through this server. This is useful for adding things like custom tracking headers.

#### Email Types

You can control which types of emails are sent using this server. This is a powerful feature that helps you maintain your deliverability and IP/domain reputation. For example, you can use one server with a high reputation for important transactional emails, and another server for bulk broadcasts.

You can choose from:

- Broadcasts (manual campaigns)

- Transactional emails

- Automated sequences (Drip style emails)

You must select at least one email type for the server to be used.

#### Custom Unsubscribe Settings

Broadcast allows you to customize the unsubscribe behavior for each server.
- **Include unsubscribe header**: Adds a `List-Unsubscribe` email header, which is a best practice for deliverability.
- **Include unsubscribe link**: Adds an unsubscribe link to the bottom of your emails.
- **Customize unsubscribe link**: Override the channel&rsquo;s default unsubscribe link with a custom one for this server.

Note that certain ESPs will automatically include an unsubscribe header and link, and these settings may not take effect. Also, if your broadcast channel does not have an email footer, these settings will not take effect.

#### Availability

You can temporarily disable an email server by unchecking the **Enable server to send emails** option. This is useful if you need to perform maintenance on a server or if you&rsquo;re experiencing deliverability issues with it and want to stop sending emails through it without deleting its configuration.

---

## Managing Subscribers

*Source: https://sendbroadcast.net/docs/managing-subscribers*

# Managing Subscribers

Subscribers are the people you want to send emails to. Both Broadcast and Sequence emails require a subscriber to be present in the channel they are being sent from.

Transactional emails do not require a subscriber to be present in the channel they are being sent from.

## Subscriber Information

For each subscriber, you can store the following information:

- Email address (required)

- First name

- Last name

- IP address

- Tags (comma separated list of tags)

- Active (true or false)

- Subscribed at date (required)

- Unsubscribed at date

- Custom data

The required values are indicated above.

For data protection reasons, you cannot alter the unsubscribed at date. For the subscribed at date, this is set automatically when a subscriber is entered manually.

When importing subscribers via a TSV file or adding subscribers via the API, the subscribed at date can be specified.

## Adding Subscribers

There are three ways to add subscribers to a channel:

- Manual entry

- TSV import (tab separated values)

- API integration

### 1. Adding subscribers manually

To manually add a subscriber, click on **Subscribers** in the sidebar, click on **Add subscriber**.

Fill in the required fields and click **Add subscriber**.

### 2. Adding subscribers via TSV import

To add subscribers via a TSV file, click on **Subscribers** in the sidebar, click on **Add subscribers**. From there, you will see an option to upload via a TSV file.

Follow the instructions on the screen to create and upload your TSV file. It is recommended that you use a spreadsheet program like Google Sheets and export the file as a TSV format.

### 3. Adding subscribers via API

Documentation coming!

## Segmentation

A native segmentation feature is not yet available but is on the roadmap.

## Viewing Subscribers

To view subscribers, click on **Subscribers** in the sidebar.

You can also search for specific subscribers by entering their full or partial email address, or by entering their name. The system will try to find the closest match.

When you click on a subscriber, you will see their details and be able to edit them. As well, on the right hand side of the screen, you will be able to see all recent activity associated with this subscriber, such as:

- API related activities (if any)

- Broadcasts that have been sent to this subscriber

- Sequences that this subscriber is in

- Transactional emails that have been sent to this subscriber

## Active vs Unsubscribed Status

Subscribers can be marked as active or active. Subscribers can also be noted to have unsubscribed from the channel.

The difference between active and unsubscribed is important to understand.

A subscriber who is marked as active will continue to receive all broadcasts, sequences, and transactional emails sent from the channel.

An unsubscribed subscriber will not receive any emails sent from the channel, irrespective of whether they are active.

The easiest way to differentiate this is that the unsubscribed status is set by the subscriber themselves, and the active status is set internally by you.

For this reason, it is recommended that if you have different interactions with subscribers (eg. transactional emails vs marketing emails), duplicate the subscriber in two separate channels.

## Exporting Subscribers

An export feature is not yet available but is on the roadmap.

---

## Broadcast Emails

*Source: https://sendbroadcast.net/docs/broadcast-emails*

# Broadcast Emails

Broadcast emails allow you to send one-time messages to your subscribers. This guide covers creating, scheduling, and analyzing broadcast emails.

Broadcasts are organized per [Channel](/docs/channels). You cannot send a broadcast to subscribers from another channel.

If you are working with multiple channels, make certain that you are in the correct channel before you start creating a broadcast.

## Creating a Broadcast

To create a broadcast, click on **Broadcasts** in the left sidebar and then click on the **New Broadcast** button.

Once there, you will see a form to fill in the details of your broadcast. Click on **Create Broadcast** to save your changes. The broadcast will be saved and will be in **Draft** status.

The form options you have available are:

- **Name**: The name of the broadcast.

- **Subject**: The subject of the broadcast.

- **Preheader**: The text that will be shown in the preheader of the email.

- **Reply-to**: The email address that recipients can reply to. If not specified, replies will go to the sender email address.

- **Body**: The content of the broadcast.

- **Tracking Options**: The options for tracking the broadcast. You can choose to track if the email was opened or clicked.

- **Email Server**: The email server that will be used to send the broadcast.

## Testing a Broadcast

It is recommended that once you are done composing your email, you should test send the email to yourself to make sure that the content is displayed correctly.

To test send a broadcast, click on **Test Send** in the top right corner of the screen under the dropdown.

Enter the email address that you would like to test send, and Broadcast will queue a test email to that address.

## Sending a Broadcast

To send a broadcast, click on **Send** in the top right corner of the screen.

Broadcast will immediately queue the email to be sent.

You will see the status of the send immediately on the screen with a progress bar.

Should any issues arise, such as SMTP errors, the broadcast will immediately be aborted and marked as failed.

---

## Email Sequences

*Source: https://sendbroadcast.net/docs/email-sequences*

# Email Sequences

Email sequences, also known as DRIP campaigns, allow you to send a series of automated emails to your subscribers. This guide covers creating and managing email sequences in Broadcast.

## How Email Sequences Work

Email sequences are made up of a series of steps.

The first step of all sequences is the **Entry Point** step. This step cannot be deleted, and all steps follow this **Entry Point** step.

Following the **Entry Point**, you can add as many steps as you would like. It is, however, recommended that you keep the email sequence simple.

Instead, to design more complex email automations, you should use multiple sequences and design sequences to transfer subscribers from one sequence to another (see below for more information).

## Creating an Email Sequences

To create an email sequence, navigate to the **Sequences** page in the sidebar and click on **New Sequence**.

A new sequence will be created with the default name of **Untitled Sequence**.

You will see a subdashboard showing you a list of subscribers to the current sequence.

On the upper right hand corner of the screen, you will see a **Settings** button. Clicking here will open a sidebar where you can change the name of the sequence. It is recommended that you give your sequence a recognizable name (eg. New User Onboarding).

A dropdown menu is also available by clicking on the down arrow beside the **Settings** button. From there you can:

- Edit the steps of the sequence

- Delete the sequence

Let&rsquo;s talk about how to manage the steps of an email sequence in the next sections.

## Managing the Steps of an Email Sequence

When managing the steps of an email sequence, the first step of all sequences is the **Entry Point** step. This step cannot be deleted, and all steps follow this **Entry Point** step.

You can add subsequent steps to this by clicking on the **+** button underneath the step you want to add a new step.

Currently, these are the types of steps you can add:

- Send Email

- Add Delay

- Add Delay Until Specific Time (Next Day, Next Week, etc.)

- Add Condition

- Move Subscribers to Sequence

- Add Tags to Subscriber

- Remove Tags from Subscriber

- Make Subscriber Inactive

The names of these steps should hopefully be self explanatory, but we will go over each of them in more detail below.

### 1. Send Email

The **Send Email** step allows you to send an email to a subscriber.

Here, you can modify the following parts of an email:

- Subject line

- Preheader text

- Email body

Note that at the **Sequence** level, you can choose which email server to use for sending all emails from this sequence. As well, you can also choose whether to track opens or clicks for sent emails from this sequence. Be aware that if you are using any conditional steps that requires knowing whether an email is opened or clicked, Broadcast will automatically enable open/click tracking at the sequence level for you.

### 2. Add Delay

The **Add Delay** step allows you to add a delay between the current step and the next step.

This is useful for introducing a minimum delay between two steps that affects users, such as sending emails or making a subscriber inactive due to a lack of engagement.

Note that delays are guaranteed to be early, meaning that the delay set is the minimum delay that will be applied. There may be a 30-60 second lag behind the delay set, depending on the load of your server.

The other thing to know about delays is that if the **next step** is a Conditional Step (see below), the delay introduced will be in addition to the delay set in the conditional step. If you do not want to track the delay in both a delay step and an immediately following conditional step, do not add the delay step and just add a conditional step.

### 3. Add Delay Until Specific Time (Next Day, Next Week, etc.)

The **Add Delay Until Specific Time** step allows you to add a delay until a specific time.

This is useful for scheduling emails to be sent at a specific time in the future.

Note that this feature can be a bit confusing, so here is some examples of how this type of delay works:

- If you set the delay to &ldquo;8:00 AM&rdquo;, the email will be sent at 8:00 AM on the next day after the previous step.

- If the step is the first step in the sequence, and the subscriber was added at 7:50 AM, the email will be sent at 8:00 AM on the same day.

Internally, this delay is calculated as the next available time that you have specified. The calculation happens at the time of the previous step.

You must specify a timezone for this delay during this step so the system knows what timezone we are operating in.

### 4. Add Condition

The **Add Condition** step allows you to add a condition to the sequence.

The condition will be evaluated as either being true or false, allowing you to create **branches** within your sequence. This provides a flexibility in allowing you to design complicated sequences.

Currently, there are four types of conditions you can use:

- Any email opened (ie. any email sent from this sequence was opened)

- Previous email opened (ie. if the immediately previous email was opened)

- Any email clicked (ie. any email sent from this sequence was clicked)

- Previous email clicked (ie. if the immediately previous email was clicked)

With each condition, you can specify the **delay** before the condition is evaluated.

Your use-case will likely vary, but here are some examples:

- Add a condition with a 24 hour delay. If the previous email was clicked, add a tag to the subscriber indicating high engagement.

- In the &ldquo;false&rdquo; branch of the above condition, add an additional condition with a delay of 1 week. If the subscriber clicks on the email, move the subscriber to medium engagement.

- Etc.

### 5. Move Subscribers to Sequence

The **Move Subscribers to Sequence** step allows you to move subscribers to another sequence.

This feature is useful for keeping your sequences simple and manageable. Designing complicated sequence flows can be done by creating multiple, simpler sequences and then moving subscribers from one sequence to another. Using this feature with conditional steps allows you to create complicated flows.

### 6. Add Tags to Subscriber

The **Add Tags to Subscriber** step allows you to add tags to a subscriber.

You can add multiple tags to a subscriber in a single sequence step.

### 7. Remove Tags from Subscriber

The **Remove Tags from Subscriber** step allows you to remove tags from a subscriber.

Note that you can remove multiple tags from a subscriber in a single sequence step. The system will attempt to remove all the specified tags from the subscriber. The subscriber does not need to have all the tags. This still will just ensure that none of the specified tags are present on the subscriber after this step.

### 8. Make Subscriber Inactive

The **Make Subscriber Inactive** step allows you to make a subscriber inactive.

The subscriber will be set as inactive not just in this sequence, but in the current channel. This will affect all sequences, broadcasts, and transactional emails sent from Broadcast **in the current channel**.

Use this sequence step as sort of a &ldquo;last resort&rdquo; to remove a subscriber altogether.

## Adding Subscribers to an Email Sequence

Subscribers can be added to an email sequence in three ways.

- Manually add subscribers to the sequence

- Add subscribers to the sequence when a tag is added to the subscriber itself

- Add a subscriber to a sequence with the API

### 1. Manually add subscribers to the sequence

To add a subscriber to the sequence, navigate to the **Sequences** page in the sidebar and click on the sequence you want to add a subscriber to.

There, you will see a table of current subscribers within this sequence.

Click **Add Subscriber** and filter the subscriber list with the name of the subscriber you want to add.

If a subscriber is already part of the sequence, Broadcast will filter these out to minimize the list of available subscribers.

### 2. Add subscribers to the sequence when a tag is added to the subscriber itself

You can also specify whether a subscriber will be added to a particular sequence through a tag.

To specify which tag the system should detect in order to add a subscriber to a sequence, navigate to the Sequence Steps editor and click on the **Entry Point** step.

Within one of the form fields, you will see an input field for **Tags**. Input the single tag you would like to use to add a subscriber to the sequence. Note that the system does not support detecting multiple tags.

### 3. Add a subscriber to a sequence with the API

Please refer to the API documentation for details on how to manage subscribers with sequences.

## Removing Subscribers from an Email Sequence

There are several ways to &ldquo;remove&rdquo; a subscriber from an email sequence.

- Inactive or unsubscribed subscribers will not be included in the sequence. As a result, you can unsubscribe a subscriber and they will be removed from all seequences.

- Subscribers can be removed from the sequence manually, such as in the dashboard.

- Subscribers can be removed from the sequence when a tag is removed from the subscriber itself. This can be done programmatically using the API or manually in the dashboard.

- Subscribers can be set as &ldquo;removed&rdquo; in the sequence. This is done manually in the dashboard.

Depending on how you intend to manage your email list, pick the one that most makes sense for your situation.

---

## Transactional Emails

*Source: https://sendbroadcast.net/docs/transactional-emails*

# Transactional Emails

Transactional emails are one-time emails sent to users based on specific triggers, such as password resets or order confirmations.

To send a transactional email, this must be done with the use of the API.

Typically, you will want to send these emails from an existing application that you built, or via a custom integration with Zapier or Make.

To learn how to use this feature, please see the [API documentation for transactional emails](/docs/api-transactional-email).

---

## Unsubscribe Settings

*Source: https://sendbroadcast.net/docs/unsubscribe-settings*

# Unsubscribe Settings

Having an option to unsubscribe from your emails is a legal requirement in many jurisdictions. As well, many email service providers require unsubscribe links to be present in outbound emails.

Please refer to rules and regulations of the countries you are sending emails to for more information.

Broadcast allows you to manage your unsubscribe settings in your outbound emails.

## Unsubscribe Link

On a per channel basis, you can set a default unsubscribe link that will be used in your automated emails ([Broadcasts](/docs/broadcast-emails) and [Email Sequences](/docs/email-sequences)).

To set the Unsubscribe Link, click on **Channel Settings** in the left sidebar. In the form field, you will see the option to set the Unsubscribe Link.

Because each link is unique to a channel and the subscriber, you cannot set a hard-coded value for the link.

Instead, Broadcast will generate a link for you that you can use in your emails.

To specify the link, you can use the `{{ unsubscribe_link }}` variable in your emails.

## Server-Specific Unsubscribe Link

Some email service providers have specific unsubscribe link options.

For example, Postmark has a slightly different unsubscribe link format. Without specifying this unsubscribe link, Postmark will automatically try to insert another link, which will make your email appear as if there are duplicate links.

To specify the server-specific unsubscribe link, click on **Channel Settings** in the left sidebar.

Under **Email Servers**, select the email server you want to customize the unsubscribe link for.

Go to **Custom Unsubscribe Settings** and enable the option **Customize unsubscribe link**. Once you do that, the form field **Customize unsubscribe link for this server** will appear.

For Postmark, for example, it uses the following format:

```
{{{ pm:unsubscribe }}}

```

So, you can enter something like this:

```
<a href="{{{ pm:unsubscribe }}}">Unsubscribe to our emails</a>

```

Once Postmark detects this link format, it will use it instead of appending its own.

## Email Provider Unsubscribe Link

You might notice that in cases where the email service provider injects its own unsubscribe link, Broadcast&rsquo;s own unsubscribe page will not be used.

This is because the email service provider&rsquo;s link takes precedence over Broadcast&rsquo;s.

Unfortunately, there is no easy way to override this without contacting the email service provider.

However, you can set up webhooks for the email service provider to let Broadcast know when a subscribe has unsubscribed. This way, your subscriber list will be up-to-date.

To learn more about email metric integration, please see the [Email Metrics](/docs/email-metrics) guide.

## Disabling Unsubscribe Link & Header

Broadcast provides an option to disable the unsubscribe link altogether in your emails. This is useful for specifying email servers that are meant to send only transactional emails, for example.

Be careful about disabling the unsubscribe link, as it is a legal requirement in many jurisdictions.

To disable a link, click on **Channel Settings** in the left sidebar. Go to **Email Servers** and select the email server you want to disable the unsubscribe link for.

In the **Custom Unsubscribe Settings** section, uncheck the option **Include unsubscribe link** and **Include unsubscriber header**.

Note that having an unsubscribe link (and header) is considered best practice, and helps with deliverability.

---

## Email Metrics

*Source: https://sendbroadcast.net/docs/email-metrics*

# Email Metrics

Broadcast allows you to track email metrics such as opens, clicks, and bounce rates.

There are two ways to track email metrics:

- Natively within the Broadcast software.

- By integrating with the email service provider&rsquo;s metrics.

## Native Metrics

Currently, it is possible to enable native metrics for Broadcasts and Sequences.

In order to enable native metrics, all you need to do is to enable the &ldquo;Track Opens&rdquo; and &ldquo;Track Clicks&rdquo; options in the Broadcast or Sequence settings.

## Email Service Provider Metrics

Broadcast can also integrate with your email service provider to track metrics such as opens, clicks, and bounce rates.

Currently, the following email service providers are supported:

- AWS SES

- Mailgun

- Postmark

- SendGrid

### Setting up AWS SES

AWS SES metric integration requires you to set up a SNS topic. Follow the steps below to set it up.

- 
In the AWS Console under the same region as your AWS SES account, create a new SNS topic. Create a topic, and choose &ldquo;Standard&rdquo; as the type.

- 
Give the topic a name, such as &ldquo;broadcast&rdquo;. You can leave the rest of the settings as default. Click on &ldquo;Create topic&rdquo;.

- 
Once created, click on &ldquo;Create subscription&rdquo; button. You will see a screen where you need to configure the endpoint where your AWS SNS Topic will send webhooks to.

- 
Choose &ldquo;HTTPS&rdquo; as the protocol. For the endpoint itself, go to your Broadcast dashboard, click on &ldquo;Channel Settings&rdquo;, then &ldquo;ESP Integrations&rdquo;, and you will see your endpoint.

- 
For example, if your installation is at https://broadcast.yourdomain.com, your endpoint will be at https://broadcast.yourdomain.com/wh/ses. You will see a message that says, &ldquo;Waiting for verification&hellip;&rdquo;. Keep this tab open because the next step will require you to copy and paste the URL that AWS SNS sends to this screen.

- 
Go back to the AWS Console, and click on &ldquo;Create subscription&rdquo;. AWS SNS will send a confirmation request to the endpoint.

- 
Go back to the Broadcast screen, and copy and paste the verification URL that AWS SNS sent to this screen.

- 
Check that the endpoint has been verified in the AWS Console. Under &ldquo;Subscriptions&rdquo;, you should see the status as &ldquo;Confirmed&rdquo;. If you go back to the Broadcast dashboard, you will see the &ldquo;Waiting for verification&hellip;&rdquo; if you refresh the page. You do not need to configure anything else here, as Broadcast will receive any messages sent from AWS SNS and verify the message internally.

- 
Now, leave the AWS SNS screen, and go to your AWS SES dashboard. On the side menu, click on &ldquo;Configuration sets&rdquo; and &ldquo;Create set&rdquo;.

- 
Give it a name, such as &ldquo;broadcast&rdquo;. You will need this name later, so make sure to remember it. Leave the rest of the settings as default. Click on &ldquo;Create set&rdquo;.

- 
Once the set is created, click on &ldquo;Event destinations&rdquo; and then on &ldquo;Add destination&rdquo;. Click &ldquo;Select All&rdquo; for all the events (eg. sends, rejects, etc), as well as opens and clicks.

- 
On the next screen, you will need to configure the destination. Give your destination a name, such as &ldquo;broadcast&rdquo;. Click on Amazon SNS, and on the bottom select the topic you created in the above steps. Click &ldquo;Next&rdquo; and &ldquo;Add destination&rdquo;.

- 
There is one more step. Within the Broadcast dashboard, go to &ldquo;Channel Settings&rdquo;, then &ldquo;Email Servers&rdquo;. Click on your AWS email server to edit it. Under &ldquo;AWS SES Configuration Set&rdquo;, enter the name you chose above for the configuration set. Click &ldquo;Update&rdquo;.

To test the integration, you can send a test email from Broadcast.

The easiest way to do this is manually add a subscriber. Go to subscribers, click on &ldquo;Add subscriber&rdquo;, and add a subscriber with an email of &ldquo;[[email&#160;protected]](/cdn-cgi/l/email-protection)
&rdquo;. This is a test email address that will bounce if used.

Create a new broadcast, and send it. If you go to the subscriber&rsquo;s detail page, you will see that the AWS SES event is being forwarded from AWS. Because the subscriber&rsquo;s email bounces, Broadcast has automatically unsubscribed and deactivated this subscriber.

Note that once the system detects a bounce, the system does not allow the user to be resubscribed in order to protect your list from having future deliverability issues.

### Setting up Mailgun

Documentation for Mailgun is coming soon.

### Setting up Postmark

Documentation for Postmark is coming soon.

### Setting up SendGrid

Documentation for SendGrid is coming soon.

---

## Upgrading

*Source: https://sendbroadcast.net/docs/upgrading*

# Upgrading

The following guide is intended for users who had installed Broadcast using the Automatic Installation method.

## Before You Upgrade

- Back up your database

## Upgrade Process

To upgrade your Broadcast installation, go to **Application** and click on **Check for updates**.

Click on **Check for updates** once more and the application will check for updates with the central upgrade server.

If an update is available, click on **Upgrade now** and you will see a popup window asking you to confirm whether you want to begin the upgrade.

The upgrade will take about 5-10 minutes (usually less). During the upgrade, your application will be unavailable for a period of several minutes. This is normal and your system will resume once the upgrade is completed.

## What is happening during the upgrade?

During the upgrade process, the system will:

- Stop the running application

- Download the new version of the application

- Restart the application, performing any database updates

## Troubleshooting

If you experience any issues during the upgrade process, feel free to contact us for support.

Here are some steps you can use to manually check your upgrade. You will need to SSH into your server system as `root`.

```
# First, check to see what is happening with the application.
# It may still be upgrading as sometimes the upgrade takes
# longer than anticipated.
systemctl status broadcast

# Go to the Broadcast installation directory
cd /opt/broadcast

# Stop the running application
./broadcast.sh stop

# Update the installer code
./broadcast.sh update

# Run the following to clean up any old trigger files
./broadcast.sh trigger

# Manually run the upgrade
./broadcast.sh upgrade

# Restart the application
./broadcast.sh start

```

Pay attention to any error messages (if any are outputted). If things do not work as expected, forward us the complete output from the above commands.

---

## API Authentication

*Source: https://sendbroadcast.net/docs/api-authentication*

# Authentication to use the Broadcast API

In order to use the Broadcast API, you need to get an Access Token (API Key).

## Creating an Access Token

By default, Broadcast creates an Access Token when you install the application.

This initial Access Token is set up so that you can send transactional emails.

However, you can create an unlimited number of additional Access Tokens, each with their own scope of permissions.

Here are the different scopes you can set for an Access Token:

- List and read broadcasts (Read)

- Send and update broadcasts (Write)

- List and read transactional emails (Read)

- Send transactional emails (Write)

- List and read subscribers (Read)

- Create and update subscribers (Write)

- List and read subscribers in sequences (Read)

- Add or remove subscribers from sequences (Write)

The labeling of the scopes should be self-explanatory.

Whenever possible, create a new access token with the exact permissions you need and not more

## Using an Access Token

All requests to the Broadcast API need to include the Access Token in the HTTP header.

To use an Access Token, you need to include it in the `Authorization` header of your HTTP requests:

```
Authorization: Bearer <YOUR_ACCESS_TOKEN>

```

If your Access Token tries to make a request that it is not authorized to make, you will get a 401 (Unauthorized) response code.

## Managing Your Access Tokens

To view and manage your Access Tokens, click on **Access Tokens** in the left sidebar of the dashboard.

### Refreshing Access Tokens

By default, any access token you create does not expire.

You can refresh (regenerate) an Access Token at any time. This will create a new token value while maintaining the same permissions.

  
    
      
        
      
    
    
      
### Important

      
        
When you refresh an Access Token, the old token value becomes invalid immediately. Any applications or integrations using the old token will stop working until you update them with the new token value.

      
    
  

To refresh an Access Token:

- Click on the token you want to refresh from the Access Tokens list

- Click the **Refresh token** button

- Confirm that you want to refresh the token

- Copy the new token value and update your applications

Always ensure you have updated all your integrations with the new token value before refreshing.

---

## API Subscribers

*Source: https://sendbroadcast.net/docs/api-subscribers*

# Subscribers API

The Subscribers API allows you to programmatically manage your subscriber list. It supports comprehensive filtering capabilities to enable efficient querying and external system synchronization.

## Required Permissions

All endpoints require authentication via an API token with appropriate permissions:

- List and read subscribers (Read)

- Create and update subscribers (Write)

## Common Use Cases

The filtering capabilities are particularly useful for:

- **External System Synchronization**: Sync unsubscribed users with your CRM by filtering `subscription_status=unsubscribed`

- **Segment Management**: Export specific subscriber segments based on tags, source, or activity status

- **Data Cleanup**: Identify inactive subscribers or those who haven&rsquo;t been emailed recently

- **Analytics and Reporting**: Generate reports for subscribers by date ranges or custom attributes

- **Compliance**: Efficiently retrieve subscription status for regulatory reporting

## Subscriber Object

The subscriber object contains the following fields:

  
    
      Field
      Description
    
  
  
    
      `id`
      The ID of the subscriber
    
    
      `email`
      The email address of the subscriber
    
    
      `first_name`
      The first name of the subscriber
    
    
      `last_name`
      The last name of the subscriber
    
    
      `ip_address`
      The IP address of the subscriber
    
    
      `is_active`
      Whether the subscriber is active
    
    
      `source`
      The source of the subscriber
    
    
      `subscribed_at`
      The date and time the subscriber was subscribed
    
    
      `unsubscribed_at`
      The date and time the subscriber was unsubscribed
    
    
      `last_email_sent_at`
      The date and time the subscriber was last sent an email
    
    
      `created_at`
      The date and time the subscriber was created
    
    
      `tags`
      An array of tags associated with the subscriber
    
    
      `custom_data`
      A JSON object, with key-value pairs
    
  

## List Subscribers

```
GET /api/v1/subscribers.json

```

### Parameters

#### Pagination

- `page`: The page number to return (default is 1)

#### Filtering Parameters

The following filtering parameters can be used to filter the subscribers list:

**Subscription Status Filtering:**

  `subscriptionstatus`: Filter by subscription status
    

      - `subscribed`: Subscribers who have not unsubscribed (unsubscribedat is null)

      - `unsubscribed`: Subscribers who have unsubscribed (unsubscribedat is not null)

      - `active`: Subscribers marked as active (isactive = true)

      - `inactive`: Subscribers marked as inactive (is_active = false)

    

  

**Source Filtering:**

  - `source`: Filter by how the subscriber was added (e.g., `website`, `api`, `import`)

**Date Range Filtering:**

  - `subscribedafter`: Filter subscribers who joined after this date (ISO 8601 format)

  - `subscribedbefore`: Filter subscribers who joined before this date (ISO 8601 format)

  - `emailedafter`: Filter subscribers who were emailed after this date (ISO 8601 format)

  - `emailedbefore`: Filter subscribers who were emailed before this date (ISO 8601 format)

**Email Pattern Filtering:**

  - `email_contains`: Filter subscribers whose email contains the specified text

**Tag-Based Filtering:**

  - `tags[]`: Filter subscribers by tags (supports multiple tags)

  `tag*match*type`: Determines how multiple tags are matched
    

      - `any`: OR logic - returns subscribers with ANY of the specified tags (default)

      - `all`: AND logic - returns subscribers with ALL of the specified tags

    

  

**Tag Filtering Logic Explanation:**

When filtering by tags, you can control the matching logic using the `tag_match_type` parameter:

**OR Logic (default):** Returns subscribers who have **ANY** of the specified tags.

**AND Logic:** Returns subscribers who have **ALL** of the specified tags.

**Example:** If you have subscribers with these tags:

  - Alice: `["premium", "newsletter"]`

  - Bob: `["premium", "vip"]`

  - Carol: `["newsletter", "trial"]`

  - Dave: `["basic"]`

**OR Logic** request `tags[]=premium&tags[]=newsletter&tag_match_type=any` returns Alice, Bob, and Carol:

  - ✅ Alice has both `premium` and `newsletter` (matches)

  - ✅ Bob has `premium` (matches one of the requested tags)

  - ✅ Carol has `newsletter` (matches one of the requested tags)

  - ❌ Dave has neither `premium` nor `newsletter`

**AND Logic** request `tags[]=premium&tags[]=newsletter&tag_match_type=all` returns only Alice:

  - ✅ Alice has both `premium` and `newsletter` (matches all required tags)

  - ❌ Bob has `premium` but not `newsletter`

  - ❌ Carol has `newsletter` but not `premium`

  - ❌ Dave has neither `premium` nor `newsletter`

**Custom Data Filtering:**

  - `custom*data[field*name]`: Filter by custom JSONB field values

### Request Examples

**Basic request:**

```
GET /api/v1/subscribers.json?page=1

```

**Filter by subscription status:**

```
GET /api/v1/subscribers.json?subscription_status=unsubscribed

```

**Filter by source and activity status:**

```
GET /api/v1/subscribers.json?subscription_status=active&source=website

```

**Filter by date range:**

```
GET /api/v1/subscribers.json?subscribed_after=2024-01-01T00:00:00Z&subscribed_before=2024-12-31T23:59:59Z

```

**Filter by tags (OR logic - subscribers with ANY of these tags):**

```
GET /api/v1/subscribers.json?tags[]=premium&tags[]=newsletter&tag_match_type=any

```

**Filter by tags (AND logic - subscribers with ALL of these tags):**

```
GET /api/v1/subscribers.json?tags[]=premium&tags[]=newsletter&tag_match_type=all

```

**Filter by tags (default behavior - OR logic when `tag_match_type` is omitted):**

```
GET /api/v1/subscribers.json?tags[]=premium&tags[]=newsletter

```

**Filter by custom data:**

```
GET /api/v1/subscribers.json?custom_data[plan]=enterprise

```

**Combined filtering:**

```
GET /api/v1/subscribers.json?subscription_status=active&source=api&subscribed_after=2024-01-01T00:00:00Z&tags[]=premium

```

### Response

```
{
  "subscribers": [
    {
      "id": "123",
      "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
      "first_name": "John",
      "last_name": "Doe",
      "ip_address": "192.168.1.1",
      "is_active": true,
      "source": "web_form",
      "subscribed_at": "2024-03-20T10:00:00Z",
      "unsubscribed_at": null,
      "last_email_sent_at": "2024-03-25T14:30:00Z",
      "created_at": "2024-03-20T10:00:00Z",
      "tags": ["newsletter", "product-updates"],
      "custom_data": { "some_key": "some value" }
    }
  ],
  "pagination": {
    "total": 1500,
    "count": 250,
    "from": 1,
    "to": 250,
    "current": 1,
    "total_pages": 6
  }
}

```

## Find Subscriber

This endpoint can be used to find a subscriber by email address and to return the details stored in your Broadcast database.

```
GET /api/v1/subscribers/find.json

```

### Parameters

- `email` (required): Email address of the subscriber

### Request

```
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://your-broadcast-domain.com/api/v1/subscribers/[[email&#160;protected]](/cdn-cgi/l/email-protection)

```

### Response

```
{
  "id": "123",
  "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
  "first_name": "John",
  "last_name": "Doe",
  "ip_address": "192.168.1.1",
  "is_active": true,
  "source": "web_form",
  "subscribed_at": "2024-03-20T10:00:00Z",
  "unsubscribed_at": null,
  "last_email_sent_at": "2024-03-25T14:30:00Z",
  "created_at": "2024-03-20T10:00:00Z",
  "tags": ["newsletter", "product-updates"],
  "custom_data": { "some_key": "some value" }
}

```

## Create Subscriber

This endpoint can be used to create a new subscriber.

### Parameters

The following parameters need to be &ldquo;namespaced&rdquo; under the `subscriber` key. See the cURL example for an example.

- `email` (required): Email address of the subscriber

- `first_name`: First name of the subscriber

- `last_name`: Last name of the subscriber

- `ip_address`: IP address of the subscriber

- `is_active`: Indicates if the subscriber is active

- `source`: Source of the subscriber

- `subscribed_at`: Timestamp when the subscriber was added

- `tags`: Array of tags to add to the subscriber

### Request

```
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "subscriber": {
      "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
      "first_name": "John",
      "last_name": "Doe",
      "ip_address": "192.168.1.1",
      "is_active": true,
      "source": "web_form",
      "subscribed_at": "2024-03-20T10:00:00Z",
      "tags": ["newsletter", "product-updates"],
      "custom_data": {
        "my_custom_data": "data value"
      }
    }
  }' \
  https://your-broadcast-domain.com/api/v1/subscribers.json

```

Note that when adding a `tags` array, you must send an array of strings.

### Response

The response code will be 201 (Created) if the subscriber was created successfully.

If a subscriber already exists in the system (eg. such as if a subscriber is added and is unsubscribed), the response will also be 201. Note that in this case, the system will assume that the subscriber has re-subscribed and will set the unsubscribed_at field as null. Any attributes passed along to the API will also be updated at the same time.

If the request is invalid, the response code will be 422 (Unprocessable Entity). The error message will be returned in the response body.

Example of an error response:

```
{
  "errors": {
    "email": ["has already been taken"]
  }
}

```

## Update Subscriber

This endpoint can be used to update a subscriber details.

### Parameters

The parameters are the same as the create subscriber endpoint, but only the fields you want to update need to be included in the request.

Again, the parameters need to be &ldquo;namespaced&rdquo; under the `subscriber` key. See the cURL example for an example.

### Request

```
curl -X PATCH \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
    "subscriber": {
      "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)"
    }
  }' \
  https://your-broadcast-domain.com/api/v1/subscribers.json

```

Note that the endpoint does not fully fit with typical RESTful conventions, as we include the email address as part of the parameters to identify the subscriber record.

### Response

The response code will be 200 (OK) and will return the subscriber JSON object.

If the request is invalid, the response code will be 422 (Unprocessable Entity). The error message will be returned in the response body.

## Deactivate Subscriber

You can deactivate a subscriber using the following endpoint:

```
POST /api/v1/subscribers/deactivate.json

```

### Parameters

- `email` (required): Email address of the subscriber to deactivate

The parameter can be either passed directly or namespaced under the `subscriber` key. See the cURL example for an example.

### Request

```
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)"
  }' \
  https://your-broadcast-domain.com/api/v1/subscribers/deactivate.json

```

### Response

The response code will be 200 (OK) if the subscriber was successfully deactivated.

## Activate Subscriber

This endpoint allows you to reactivate a previously deactivated subscriber.

```
POST /api/v1/subscribers/activate.json

```

### Parameters

- `email` (required): Email address of the subscriber to activate

The parameter can be either passed directly or namespaced under the `subscriber` key. See the cURL example for an example.

### Request

```
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)"
  }' \
  https://your-broadcast-domain.com/api/v1/subscribers/activate.json

```

### Response

The response code will be 200 (OK) if the subscriber was successfully activated.

## Add Tags To Subscriber

This endpoint allows you to add one or more tags to a subscriber.

```
POST /api/v1/subscribers/add_tag.json

```

### Parameters

- `email` (required): Email address of the subscriber

- `tags` (required): An array of tags to add to the subscriber

The parameter can be either passed directly or namespaced under the `subscriber` key. See the cURL example for an example.

### Request

```
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
    "tags": ["newsletter", "product-updates"]
  }' \
  https://your-broadcast-domain.com/api/v1/subscribers/add_tag.json

```

### Response

The response code will be 200 (OK) if the tags were successfully added.

## Remove Tags From Subscriber

This endpoint allows you to remove one or more tags from a subscriber.

```
DELETE /api/v1/subscribers/remove_tag.json

```

### Parameters

- `email` (required): Email address of the subscriber

- `tags` (required): An array of tags to remove from the subscriber

The parameter can be either passed directly or namespaced under the `subscriber` key. See the cURL example for an example.

### Request

```
curl -X DELETE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
    "tags": ["newsletter"]
  }' \
  https://your-broadcast-domain.com/api/v1/subscribers/remove_tag.json

```

### Response

The response code will be 200 (OK) if the tags were successfully removed.

---

## API Broadcasts

*Source: https://sendbroadcast.net/docs/api-broadcasts*

# Broadcast API

The Broadcast API provides full CRUD (Create, Read, Update, Delete) operations for managing email broadcast campaigns. You can create, list, view, update, delete, and send broadcasts programmatically.

## Required Permissions

All endpoints require authentication via an API token with appropriate permissions:

- **Read Permission**: Required for GET endpoints (list, show)

- **Write Permission**: Required for POST, PATCH, DELETE endpoints and send operations

## Broadcast Object

The broadcast object contains the following fields:

  
    
      Field
      Description
    
  
  
    
      `id`
      The unique identifier of the broadcast
    
    
      `subject`
      The subject line of the email
    
    
      `preheader`
      Preview text that appears in email clients
    
    
      `body`
      The content of the email
    
    
      `name`
      The internal name of the broadcast
    
    
      `track_opens`
      Whether open tracking is enabled for this broadcast
    
    
      `track_clicks`
      Whether click tracking is enabled for this broadcast
    
    
      `status`
      Current status of the broadcast (draft, scheduled, sending, sent, etc.)
    
    
      `html_body`
      Whether the body contains HTML content
    
    
      `reply_to`
      Reply-to email address
    
    
      `total_recipients`
      Total number of recipients
    
    
      `sent_at`
      Timestamp when the broadcast was sent
    
    
      `scheduled_send_at`
      Timestamp when the broadcast is scheduled to send
    
  

## List Broadcasts

```
GET /api/v1/broadcasts

```

Retrieve a list of all broadcasts for the authenticated broadcast channel.

### Query Parameters

- `limit` (optional): Maximum number of broadcasts to return

- `offset` (optional): Number of broadcasts to skip for pagination

### Request

```
curl -X GET \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://your-domain.com/api/v1/broadcasts

```

### Response

```
{
  "data": [
    {
      "id": 1,
      "name": "Weekly Newsletter",
      "subject": "Your Weekly Update",
      "status": "draft",
      "total_recipients": 0,
      "sent_at": null,
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "total": 1
}

```

## Get Broadcast

```
GET /api/v1/broadcasts/:id

```

Retrieve details of a specific broadcast.

### Request

```
curl -X GET \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://your-domain.com/api/v1/broadcasts/123

```

### Response

```
{
  "id": 123,
  "name": "Weekly Newsletter",
  "subject": "Your Weekly Update",
  "body": "<p>Newsletter content here</p>",
  "reply_to": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
  "status": "draft",
  "track_opens": true,
  "track_clicks": true,
  "total_recipients": 150,
  "sent_at": null,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}

```

## Create Broadcast

```
POST /api/v1/broadcasts

```

### Parameters

- `subject` (required): Subject line of the email

- `body` (required): Content of the email, which can be either a simple string or HTML

- `name` (optional): Internal name of the broadcast

- `preheader` (optional): Preview text that appears in email clients

- `html_body` (optional): Whether the body contains HTML (default: false)

- `reply_to` (optional): Reply-to email address

- `track_opens` (optional): Whether open tracking is enabled (default: false)

- `track_clicks` (optional): Whether click tracking is enabled (default: false)

- `scheduled_send_at` (optional): ISO 8601 datetime for scheduled sending

- `scheduled_timezone` (optional): Timezone for scheduled sending

- `segment_ids` (optional): Array of segment IDs to target

- `email_server_ids` (optional): Array of specific email server IDs to use

### Request

```
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "broadcast": {
      "subject": "Test Subject",
      "preheader": "Test Preheader",
      "body": "<p>Test Body</p>",
      "name": "Test Name",
      "reply_to": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
      "track_opens": true,
      "track_clicks": true
    }
  }' \
  http://your-domain.com/api/v1/broadcasts

```

Take note that the `body` field should be a valid HTML string. If it is not a valid HTML string, the broadcast&rsquo;s rendered body will be malformed.

When you edit a draft broadcast, the application will attempt to fix any malformed HTML, but this is not always possible.

In general, line breaks should be represented as `<br>` tags, and paragraphs should be wrapped in `<p>` tags. If you reference images, you must ensure that the image URL is valid.

You do not need to include the head or body tags in the body field. Broadcast will automatically wrap the content of your body during the outbound mail processing.

### Response

```
{
  "id": 123
}

```

## Update Broadcast

```
PATCH /api/v1/broadcasts/:id

```

Update an existing broadcast. Only broadcasts in `draft` or `scheduled` status can be updated.

### Request

```
curl -X PATCH \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "broadcast": {
      "subject": "Updated Subject",
      "body": "<p>Updated content</p>"
    }
  }' \
  http://your-domain.com/api/v1/broadcasts/123

```

### Response

```
{
  "id": 123,
  "name": "Updated Newsletter",
  "subject": "Updated Subject",
  "body": "<p>Updated content</p>",
  "reply_to": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
  "status": "draft",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:30:00Z"
}

```

## Delete Broadcast

```
DELETE /api/v1/broadcasts/:id

```

Delete a broadcast. Only broadcasts in `draft` or `scheduled` status can be deleted.

### Request

```
curl -X DELETE \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://your-domain.com/api/v1/broadcasts/123

```

### Response

```
{
  "message": "Broadcast deleted successfully"
}

```

## Send Broadcast

```
POST /api/v1/broadcasts/:id/send_broadcast

```

Queue a broadcast for immediate sending. The broadcast must be in `draft` or `failed` status and must be sendable (have required content).

### Request

```
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://your-domain.com/api/v1/broadcasts/123/send_broadcast

```

### Response

```
{
  "id": 123,
  "message": "Broadcast queued for sending",
  "status": "queueing"
}

```

## Broadcast Status Values

- `draft`: Being composed, can be edited

- `scheduled`: Scheduled for future sending, can be edited

- `queueing`: Being prepared for sending

- `sending`: Currently being sent

- `sent`: Successfully sent

- `failed`: Failed to send

- `partial_failure`: Some recipients failed

- `aborted`: Manually stopped

- `paused`: Temporarily paused

## Error Responses

If the request is invalid, the response will include an appropriate HTTP status code and error message:

### 400 Bad Request

```
{
  "error": "Broadcast is not ready to send"
}

```

### 401 Unauthorized

```
{
  "error": "Unauthorized"
}

```

### 404 Not Found

```
{
  "error": "Broadcast not found"
}

```

### 422 Unprocessable Entity

```
{
  "error": "Subject can't be blank, Body can't be blank"
}

```

---

## API Transactional Email

*Source: https://sendbroadcast.net/docs/api-transactional-email*

# Transactional Email API

The Transactional Email API allows you to programmatically send individual, personalized emails triggered by specific events in your application.

## Required Permissions

All endpoints require authentication via an API token with appropriate permissions:

- View transactional email details (Read)

- Send transactional emails (Write)

## Transactional Email Object

The transactional email object contains the following fields:

  
    
      Field
      Description
    
  
  
    
      `id`
      The unique identifier of the transactional email
    
    
      `recipient_email`
      The email address of the recipient
    
    
      `recipient_name`
      The name of the recipient (optional)
    
    
      `subject`
      The subject line of the email
    
    
      `body`
      The content of the email
    
    
      `preheader`
      Preview text that appears in email clients
    
    
      `reply_to`
      Reply-to email address for this transactional email
    
    
      `queue_at`
      The scheduled time for sending the email
    
    
      `sent_at`
      The time when the email was sent
    
    
      `created_at`
      The time when the record was created
    
    
      `updated_at`
      The time when the record was last updated
    
    
      `status_url`
      URL to check the status of this transactional email
    
  

## Send Transactional Email

```
POST /api/v1/transactionals.json

```

### Parameters

- `to` (required): Email address of the recipient

- `subject` (required): Subject line of the email

- `body` (required): Content of the email, which can be either a simple string or HTML. In either case, Broadcast will wrap the content in the appropriate html and body tags. If you want to incorporate an entire HTML design, just send the contents within the body tag.

- `reply_to` (optional): Reply-to email address for this transactional email

### Request

```
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "to": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
    "subject": "Welcome to Our Service",
    "body": "Thank you for signing up!",
    "reply_to": "[[email&#160;protected]](/cdn-cgi/l/email-protection)"
  }' \
  https://your-broadcast-domain.com/api/v1/transactionals.json

```

### Response

```
{
  "id": "123",
  "recipient_email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
  "recipient_name": "John Doe",
  "subject": "Welcome to Our Service",
  "body": "Thank you for signing up!",
  "preheader": "Welcome to our amazing service",
  "reply_to": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
  "queue_at": "2024-03-21T10:00:00Z",
  "sent_at": null,
  "created_at": "2024-03-21T09:00:00Z",
  "updated_at": "2024-03-21T09:00:00Z",
  "status_url": "https://your-broadcast-domain.com/api/v1/transactionals/123.json"
}

```

If the request is invalid, the response code will be 422 (Unprocessable Entity). The error message will be returned in the response body:

```
{
  "errors": {
    "recipient_email": ["can't be blank"],
    "subject": ["can't be blank"],
    "body": ["can't be blank"]
  }
}

```

## Get Transactional Email Details

```
GET /api/v1/transactionals/:id.json

```

### Parameters

- `id` (required): The ID of the transactional email

### Request

```
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://your-broadcast-domain.com/api/v1/transactionals/123.json

```

### Response

```
{
  "id": "123",
  "recipient_email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
  "recipient_name": "John Doe",
  "subject": "Welcome to Our Service",
  "body": "Thank you for signing up!",
  "preheader": "Welcome to our amazing service",
  "reply_to": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
  "queue_at": "2024-03-21T10:00:00Z",
  "sent_at": null,
  "created_at": "2024-03-21T09:00:00Z",
  "updated_at": "2024-03-21T09:00:00Z",
  "status_url": "https://your-broadcast-domain.com/api/v1/transactionals/123.json"
}

```

## Notes

- When sending a transactional email, if no specific queue time is provided, the email will be queued immediately.

- If the recipient&rsquo;s email matches an existing subscriber in your database, the transactional email will be automatically associated with that subscriber&rsquo;s record.

- All API requests must include a valid API token with the appropriate permissions in the Authorization header.

---

## API Sequences

*Source: https://sendbroadcast.net/docs/api-sequences*

# Sequences API

The Sequences API allows you to add and remove subscribers within sequences programmatically, as well as list current subscribers in a sequence.

This API endpoint is not for modifying or creating sequences themselves. This must be done within Broadcast&rsquo;s user interface.

## Required Permissions

All endpoints require authentication via an API token with appropriate permissions:

- List and read subscribers in sequences (Read)

- Add or remove subscribers from sequences (Write)

## Subscriber Sequence Object

  
    
      Field
      Description
    
  
  
    
      `id`
      Unique identifier of the subscriber sequence
    
    
      `status`
      Current status of the sequence subscription
    
    
      `started_at`
      When the subscriber was added to the sequence
    
    
      `completed_at`
      When the subscriber completed or was removed from the sequence
    
    
      `next_trigger_at`
      When the next email in the sequence will be sent
    
    
      `subscriber`
      Information about the subscriber
    
    
      `subscriber.id`
      Unique identifier of the subscriber
    
    
      `subscriber.email`
      Email address of the subscriber
    
  

## Endpoints

Important: For the following endpoints, you will need the `id` of the sequence. You can find this in the URL of the sequence in the user interface.

For example, if your sequence URL is `https://broadcast.example.com/sequences/6`, then the `id` would be `6`.

### List Subscribers in a Sequence

```
GET /api/v1/sequences/:id/list_subscribers.json?page=1

```

Returns a paginated list of subscribers in the specified sequence.

### Parameters

- `id` (required): The ID of the sequence in the URL

- `page`: The page number to return (default is 1)

### Response

```
{
  "subscriber_sequences": [
    {
      "id": "123",
      "status": "active",
      "started_at": "2024-03-20T10:00:00Z",
      "completed_at": null,
      "next_trigger_at": "2024-03-21T10:00:00Z",
      "subscriber": {
        "id": "456",
        "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)"
      }
    }
  ],
  "pagination": {
    "prev": null,
    "next": 2,
    "count": 95,
    "pages": 10,
    "page": 1
  }
}

```

## Add Subscriber to Sequence

Note that this endpoint will try and add an existing subscriber to the sequence based on the email address.

If the subscriber email does not exist in the system, the subscriber will be created along with adding them to the sequence.

```
POST /api/v1/sequences/:id/add_subscriber.json

```

Adds a subscriber to the specified sequence.

### Parameters

- `id` (required): The ID of the sequence in the URL

And the following parameters under the &ldquo;subscriber&rdquo; key:

- `email` (required): The email address of the subscriber

- `first_name`: The first name of the subscriber

- `last_name`: The last name of the subscriber

### Request

```
curl -X POST 'https://your-broadcast-domain.com/api/v1/sequences/123/add_subscriber.json' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "subscriber": {
      "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
      "first_name": "John",
      "last_name": "Doe"
    }
  }'

```

### Response

Returns `201 Created` on success or `422 Unprocessable Entity` if the request fails.

## Remove Subscriber from Sequence

```
DELETE /api/v1/sequences/:id/remove_subscriber

```

Removes a subscriber from the specified sequence.

### Parameters

- `id` (required): The ID of the sequence in the URL

And the following parameters under the &ldquo;subscriber&rdquo; key:

- `email` (required): The email address of the subscriber

### Request

```
curl -X DELETE 'https://your-broadcast-domain.com/api/v1/sequences/123/remove_subscriber' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "subscriber": {
      "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)"
    }
  }'

```

### Response

Returns `200 OK` on success or `422 Unprocessable Entity` if the request fails.

---

## Domain Names

*Source: https://sendbroadcast.net/docs/domain-names*

# Domain Names

In Broadcast, your main installation domain name is your primary domain. What this means is that all of the following links and URL references that are generated from within Broadcast uses this domain:

- Unsubscribe links

- Tracking pixels

- Lead capture forms

In order to set your primary domain name properly, you must:

- Have the IP address of your server

- Have a domain name you own

Note that you do not need to use the &ldquo;root&rdquo; domain. For example, if your domain is example.com, you can use a subdomain like broadcast.example.com as the primary domain of your Broadcast installation.

## Using multiple domains

With Broadcast, you can use more than one domain for your single Broadcast installation. Each [broadcast channel](/docs/terminology) is capable of having its own domain.

If you do not set a domain on a broadcast channel, then the primary domain becomes the default for that channel.

By organizing your lists into separate channels, you can use a separate domain for each of them.

---

## Suppression Lists

*Source: https://sendbroadcast.net/docs/suppression-lists*

# Suppression Lists

Suppression lists allow you to prevent emails from being sent to specific email addresses. This is crucial for maintaining good deliverability and compliance with email marketing regulations.

Broadcast supports two types of suppressions:

- **Channel-specific suppressions**: Block emails for a specific channel only

- **Global suppressions**: Block emails across all channels in your application

## Understanding Suppressions

When an email address is added to a suppression list, Broadcast will automatically prevent any emails (broadcasts, sequences, or transactional emails) from being sent to that address. This happens automatically during the sending process.

### Channel-specific vs Global Suppressions

- **Channel-specific suppressions**: These email addresses are suppressed only for the current channel. They can still receive emails from other channels.

- **Global suppressions**: These email addresses are suppressed across all channels in your application. They will not receive any emails regardless of which channel is sending them.

  
    
      
        
      
    
    
      
        **Important:** Suppressions are permanent until manually removed. Make sure you&rsquo;re adding the correct email addresses to your suppression lists.
      
    
  

## Accessing Suppression Lists

To access suppression lists, navigate to **Settings** → **Suppression List** in your channel dashboard.

You&rsquo;ll see two tabs:
- **This Channel**: Shows email addresses suppressed for the current channel only
- **Global**: Shows email addresses suppressed across all channels

## Adding Individual Suppressions

### Single Email Address

- Navigate to **Settings** → **Suppression List**

- Click **Add Suppression**

- Enter the email address you want to suppress

Choose the suppression type:

- **Channel-specific suppression**: Suppresses emails only for the current channel

- **Global suppression**: Suppresses emails across all channels

- Click **Add Suppression**

## Bulk Upload Suppressions

For larger lists, you can upload multiple email addresses at once using a text file.

### Preparing Your File

- Create a plain text file (.txt extension)

- Add one email address per line

- Ensure each email address is properly formatted

Example file content:

```
[[email&#160;protected]](/cdn-cgi/l/email-protection)
[[email&#160;protected]](/cdn-cgi/l/email-protection)
[[email&#160;protected]](/cdn-cgi/l/email-protection)

```

### Uploading the File

- Navigate to **Settings** → **Suppression List**

- Click **Upload Suppression List**

Choose your suppression type:

- **This Channel Only**: Suppresses emails only for the current channel

- **All Channels (Global)**: Suppresses emails across all channels

- Select your text file

- Click **Upload**

Broadcast will process the file and provide a summary of:
- How many email addresses were added
- How many were already suppressed (skipped)
- How many were invalid (skipped)

  
    
      
        
      
    
    
      
        **Tip:** Only plain text files (.txt) are supported for bulk uploads. If you have your list in a spreadsheet, export it as a text file with one email per line.
      
    
  

## Managing Suppressions

### Viewing Suppressions

The suppression list interface allows you to:
- View all suppressed email addresses
- See when each suppression was added
- Search for specific email addresses
- Filter by suppression type

### Searching Suppressions

Use the search box to quickly find specific email addresses in your suppression lists. The search will match partial email addresses, making it easy to find all suppressions for a particular domain.

### Removing Suppressions

To remove an email address from the suppression list:

- Navigate to **Settings** → **Suppression List**

- Find the email address you want to remove

- Click **Remove** next to the email address

- Confirm the removal

  
    
      
        
      
    
    
      
        **Warning:** Once you remove an email address from the suppression list, it will be able to receive emails again. Make sure this is intentional.
      
    
  

## How Suppressions Work

### Automatic Checking

Broadcast automatically checks all suppression lists before sending any email:

- **Broadcast emails**: Checked before sending to each subscriber

- **Sequence emails**: Checked before each sequence step is sent

- **Transactional emails**: Checked before sending via API

### Priority Order

If an email address appears in multiple suppression lists, Broadcast follows this priority:

- **Global suppressions** always take precedence

- **Channel-specific suppressions** are checked for the sending channel

### Integration with Email Sending

When a suppressed email address is encountered during sending:
- The email is skipped automatically
- The suppression is logged in the email activity
- No error is generated (this is normal behavior)

## Best Practices

### When to Use Suppressions

Use suppression lists for:

- **Bounced emails**: Addresses that consistently bounce

- **Spam complaints**: Addresses that have marked your emails as spam

- **Legal compliance**: Addresses that have requested removal

- **Internal testing**: Test addresses that shouldn&rsquo;t receive production emails

### Maintaining Your Lists

- **Regular cleanup**: Review your suppression lists periodically

- **Documentation**: Keep records of why addresses were suppressed

- **Global vs channel**: Use global suppressions for addresses that should never receive any emails

- **Backup**: Consider exporting your suppression lists as backups

### Compliance Considerations

- **Respect requests**: Always honor suppression requests from recipients

- **Legal requirements**: Some jurisdictions require permanent suppression for certain types of requests

- **Documentation**: Keep records of suppression requests for compliance purposes

## Troubleshooting

### Common Issues

**Q: Why isn&rsquo;t my suppression working?**
A: Check that the email address is spelled correctly and that you&rsquo;ve selected the right suppression type (channel-specific vs global).

**Q: Can I export my suppression lists?**
A: Export functionality is planned for a future release. Currently, you can view and search your suppressions through the interface.

**Q: What happens to existing scheduled emails?**
A: Suppressions are checked at send time, so any scheduled emails to suppressed addresses will be automatically skipped when they&rsquo;re due to be sent.

**Q: Are suppressions case-sensitive?**
A: No, email addresses are normalized to lowercase, so suppressions work regardless of the case of the original email address.

---

## Templates

*Source: https://sendbroadcast.net/docs/templates*

# Email Templates

Templates allow you to save time by creating reusable email designs and content. You can use templates to quickly populate content for broadcasts, sequence emails, and transactional emails, ensuring brand consistency across all your communications.

## Creating a New Template

To create your first template, navigate to the **Templates** section from the main navigation. Click on the **+ New Template** button. A dialog will appear asking you to choose the kind of template you want to create: HTML or Rich Text.

### Template Types

You have two options for creating a template:

-   **Rich Text**: This option opens a user-friendly WYSIWYG (What You See Is What You Get) editor. It&rsquo;s perfect for creating beautiful emails without needing to know how to code. You can format text, add images, and create layouts with ease.

-   **HTML**: This option is for users who prefer to use their own custom HTML. You can paste in your code from another source or write it from scratch in our code editor.

## Template Editor

After choosing your template type, you will be taken to the template editor. The description at the top of the form says: &ldquo;The template details here can be used to quickly autofill broadcasts, sequences, and transactional emails.&rdquo;

### Rich Text Editor

The Rich Text editor allows you to craft your email in a visual way.

Here are the fields you need to fill out:

-   **Give this template a label so you can easily identify it later**: This is an internal name for your template, like &ldquo;Welcome Email&rdquo; or &ldquo;Weekly Newsletter&rdquo;. It won&rsquo;t be visible to your subscribers.

-   **Subject**: The subject line for your email.

-   **Preheader**: The preview text that appears next to the subject line in an email client.

-   **Body**: The main content of your email. Use the toolbar to format your text, add links, lists, and more.

### HTML Editor

The HTML editor gives you full control over the email&rsquo;s code.

The fields for Label, Subject, and Preheader are the same as the Rich Text editor. The **Body** field, however, is a code editor where you can input your HTML.

Once you are done, click **Create Template** to save it.

## Using Templates

You can use templates within broadcasts. When creating a new broadcast, you will see a button for &ldquo;Use a template&rdquo;. This option is only available when you are creating a new broadcast. Updating an existing broadcast (in draft mode) will not display this button.

Clicking this button will open a &ldquo;Select template&rdquo; modal where you can see a list of all your created templates.

You can search for templates by their label. Once you&rsquo;ve found the template you want to use, click the **Use template** button. The content of the template—Subject, Preheader, and Body—will be loaded into the broadcast editor.

You can modify any part of the inserted template to customize for your needs for that particular broadcast.

---

## API Segments

*Source: https://sendbroadcast.net/docs/api-segments*

# Segments API

The Segments API allows you to list your segments that you defined in your channel, as well as query specific segments for a list of subscribers that belong within that segment.

This API endpoint is not for modifying or creating segments themselves. This must be done within Broadcast&rsquo;s user interface.

## Required Permissions

All endpoints require authentication via an API token with appropriate permissions:

- List and read segments (Read)

## Segment Object

  
    
      Field
      Description
    
  
  
    
      `id`
      Unique identifier of the segment
    
    
      `name`
      Name of the segment
    
    
      `description`
      Description of the segment
    
    
      `created_at`
      When the segment was created
    
  

## Endpoints

### List Segments

```
GET /api/v1/segments.json?page=1

```

Returns a paginated list of segments that belong to a channel (as determined by your access token).

### Parameters

- `page`: Optional parameter for the page number to return (default is 1)

### Response

```
{
  "segments": [
    {
      "id": 1,
      "name": "Active Subscribers",
      "description": "Subscribers who have opened at least one email in the last 30 days.",
      "created_at": "2024-06-01T12:34:56Z"
    }
  ]
}

```

### List Subscribers in a Segment

```
GET /api/v1/segments/1.json?page=1

```

Returns a paginated list of subscribers in a specific segment (of up to 250 subscribers per page).

### Parameters

- `page`: Optional parameter for the page number to return (default is 1)

### Response

```
{
  "segment": {
    "id": 1,
    "name": "Active Subscribers",
    "description": "Subscribers who have opened at least one email in the last 30 days.",
    "created_at": "2024-06-01T12:34:56Z"
  },
  "subscribers": [
    {
      "id": "123",
      "email": "[[email&#160;protected]](/cdn-cgi/l/email-protection)",
      "first_name": "John",
      "last_name": "Doe",
      "ip_address": "192.168.1.1",
      "is_active": true,
      "source": "web_form",
      "subscribed_at": "2024-03-20T10:00:00Z",
      "unsubscribed_at": null,
      "created_at": "2024-03-20T10:00:00Z",
      "tags": ["newsletter", "product-updates"]
    }
  ]
}

```

---

