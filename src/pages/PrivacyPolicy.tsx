import React from 'react';
import PageLayout from '@/components/PageLayout';
import { Helmet } from 'react-helmet-async';

const PrivacyPolicy = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Privacy Policy - DamiTV</title>
        <meta name="description" content="Read DamiTV's privacy policy to understand how we collect, use, and protect your personal information." />
        <link rel="canonical" href="https://damitv.pro/privacy" />
      </Helmet>

      <div className="py-8 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <section>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Last Updated: January 2025
            </p>
            <p className="text-lg">
              At DamiTV ("we", "our", or "us"), we are committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you visit our website damitv.pro.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">1. Information We Collect</h2>
            
            <h3 className="text-2xl font-bold mb-3 mt-6">1.1 Information You Provide</h3>
            <p>
              We may collect information that you voluntarily provide to us, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email address (if you subscribe to our newsletter)</li>
              <li>Name and contact information (if you contact us)</li>
              <li>Any other information you choose to provide</li>
            </ul>

            <h3 className="text-2xl font-bold mb-3 mt-6">1.2 Automatically Collected Information</h3>
            <p>
              When you visit our website, we automatically collect certain information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Pages visited and time spent on pages</li>
              <li>Referring website addresses</li>
              <li>Device information</li>
            </ul>

            <h3 className="text-2xl font-bold mb-3 mt-6">1.3 Cookies and Tracking Technologies</h3>
            <p>
              We use cookies, web beacons, and similar tracking technologies to enhance your experience. 
              Cookies are small data files stored on your device. You can control cookie settings through 
              your browser preferences.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">2. How We Use Your Information</h2>
            <p>We use collected information for various purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide, maintain, and improve our services</li>
              <li>To personalize your experience on our website</li>
              <li>To analyze website usage and trends</li>
              <li>To send newsletters and updates (with your consent)</li>
              <li>To respond to your inquiries and provide customer support</li>
              <li>To detect, prevent, and address technical issues and fraud</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">3. Third-Party Services and Advertising</h2>
            
            <h3 className="text-2xl font-bold mb-3 mt-6">3.1 Advertising Partners</h3>
            <p>
              We use third-party advertising companies to serve ads when you visit our website. 
              These companies may use information about your visits to this and other websites 
              to provide advertisements about goods and services of interest to you.
            </p>

            <h3 className="text-2xl font-bold mb-3 mt-6">3.2 Google AdSense</h3>
            <p>
              We use Google AdSense to display advertisements. Google uses cookies to serve ads 
              based on your prior visits to our website or other websites. You may opt out of 
              personalized advertising by visiting{' '}
              <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Google Ads Settings
              </a>.
            </p>

            <h3 className="text-2xl font-bold mb-3 mt-6">3.3 Analytics</h3>
            <p>
              We use analytics services like Google Analytics to understand how visitors use our site. 
              These services collect information such as how often users visit the site, what pages they 
              visit, and what other sites they used prior to coming to our site.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">4. Information Sharing and Disclosure</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition</li>
              <li><strong>With Consent:</strong> When you have given us explicit consent to share your information</li>
            </ul>
            <p className="mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal 
              information. However, no method of transmission over the Internet or electronic storage 
              is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">6. Your Rights and Choices</h2>
            <p>You have certain rights regarding your personal information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Opt-Out:</strong> Opt out of marketing communications</li>
              <li><strong>Cookie Control:</strong> Manage cookie preferences through your browser</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">7. Children's Privacy</h2>
            <p>
              Our website is not intended for children under 13 years of age. We do not knowingly 
              collect personal information from children under 13. If you are a parent or guardian 
              and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">8. International Data Transfers</h2>
            <p>
              Your information may be transferred to and maintained on computers located outside of 
              your state, province, country, or other governmental jurisdiction where data protection 
              laws may differ from those in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">9. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page and updating the "Last Updated" date. 
              You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-none space-y-2 mt-4">
              <li>Email: <a href="mailto:privacy@damitv.pro" className="text-primary hover:underline">privacy@damitv.pro</a></li>
              <li>Contact Page: <a href="/contact" className="text-primary hover:underline">damitv.pro/contact</a></li>
            </ul>
          </section>

          <section className="bg-primary/10 p-6 rounded-lg mt-8">
            <h3 className="text-xl font-bold mb-2">Your Consent</h3>
            <p>
              By using our website, you consent to our Privacy Policy and agree to its terms. 
              If you do not agree with this policy, please do not use our website.
            </p>
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default PrivacyPolicy;