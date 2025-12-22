import React, { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { Helmet } from 'react-helmet-async';
import { Mail, MessageSquare, HelpCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "Thank you for contacting us. We'll get back to you soon.",
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <PageLayout>
      <Helmet>
        <title>Contact DamiTV - Get in Touch With Us</title>
        <meta name="description" content="Contact DamiTV for support, feedback, or partnership inquiries. We're here to help with any questions about our free sports streaming service." />
        <meta name="keywords" content="contact damitv, sports streaming support, damitv help, customer service, report broken stream" />
        <link rel="canonical" href="https://damitv.pro/contact" />
        <meta name="robots" content="index, follow" />
        
        <meta property="og:title" content="Contact DamiTV - Get in Touch With Us" />
        <meta property="og:description" content="Contact DamiTV for support, feedback, or partnership inquiries." />
        <meta property="og:url" content="https://damitv.pro/contact" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://damitv.pro/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Contact",
              "item": "https://damitv.pro/contact"
            }
          ]
        })}
        </script>
        
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Is DamiTV really free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, DamiTV is completely free to use. There are no hidden fees, subscriptions, or registration required."
              }
            },
            {
              "@type": "Question",
              "name": "Why is my stream not working?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Try switching to an alternative stream source. We provide multiple sources for each match. Also, ensure you have a stable internet connection and try disabling ad blockers if streams won't load."
              }
            },
            {
              "@type": "Question",
              "name": "Can I watch on mobile devices?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Absolutely! DamiTV is fully responsive and works on smartphones, tablets, and desktop computers."
              }
            },
            {
              "@type": "Question",
              "name": "How do I report a broken stream?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Use the contact form or email us at support@damitv.pro with the match details and the issue you're experiencing."
              }
            }
          ]
        })}
        </script>
      </Helmet>

      <div className="py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Contact Us</h1>
          <p className="text-center text-lg mb-12">
            Have questions, feedback, or need assistance? We're here to help!
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800">
                  <Mail className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-bold mb-1">Email Support</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      For general inquiries and support, email us at:
                    </p>
                    <a href="mailto:support@damitv.pro" className="text-primary hover:underline">
                      support@damitv.pro
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800">
                  <MessageSquare className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-bold mb-1">Telegram Community</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Join our Telegram channel for instant updates and community support.
                    </p>
                    <a href="https://t.me/Sports_matches_bot" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Join Telegram
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800">
                  <HelpCircle className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-bold mb-1">DMCA & Copyright</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      For copyright-related inquiries, visit our DMCA page.
                    </p>
                    <a href="/dmca" className="text-primary hover:underline">
                      DMCA Notice
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
                <h3 className="font-bold mb-2">Response Time</h3>
                <p className="text-sm">
                  We typically respond to all inquiries within 24-48 hours. For urgent matters, 
                  please mark your subject line as "URGENT".
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a subject</option>
                    <option value="technical">Technical Support</option>
                    <option value="feedback">Feedback & Suggestions</option>
                    <option value="bug">Report a Bug</option>
                    <option value="dmca">DMCA / Copyright</option>
                    <option value="partnership">Partnership Inquiry</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </div>
          </div>

          <section className="bg-white dark:bg-black p-8 rounded-lg border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">Is DamiTV really free?</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes, DamiTV is completely free to use. There are no hidden fees, subscriptions, or registration required.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Why is my stream not working?</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try switching to an alternative stream source. We provide multiple sources for each match. 
                  Also, ensure you have a stable internet connection and try disabling ad blockers if streams won't load.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Can I watch on mobile devices?</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Absolutely! DamiTV is fully responsive and works on smartphones, tablets, and desktop computers.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-2">How do I report a broken stream?</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Use the contact form above or email us with the match details and the issue you're experiencing.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default Contact;