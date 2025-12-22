import React from 'react';
import PageLayout from '@/components/PageLayout';
import { Helmet } from 'react-helmet-async';

const TermsOfService = () => {
  return (
    <PageLayout>
      <Helmet>
        <title>Terms of Service - DamiTV</title>
        <meta name="description" content="Read DamiTV's terms of service to understand the rules and regulations for using our live sports streaming platform." />
        <link rel="canonical" href="https://damitv.pro/terms" />
      </Helmet>

      <div className="py-8 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <section>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Last Updated: January 2025
            </p>
            <p className="text-lg">
              Welcome to DamiTV. These Terms of Service ("Terms") govern your access to and use of 
              the DamiTV website located at damitv.pro ("Website", "Service"). By accessing or using 
              our Service, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using DamiTV, you accept and agree to be bound by the terms and provisions 
              of this agreement. If you do not agree to these Terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">2. Description of Service</h2>
            <p>
              DamiTV provides a platform for accessing live sports streaming content. Our Service includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access to live sports streams from various sources</li>
              <li>Sports schedules and match information</li>
              <li>Sports news and updates</li>
              <li>TV channel streaming</li>
              <li>Community features and social sharing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">3. User Responsibilities</h2>
            
            <h3 className="text-2xl font-bold mb-3 mt-6">3.1 Acceptable Use</h3>
            <p>You agree to use DamiTV only for lawful purposes. You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service in any way that violates any applicable law or regulation</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use any automated system to access the Service</li>
              <li>Reproduce, duplicate, copy, or resell any part of our Service</li>
              <li>Transmit any malware, viruses, or harmful code</li>
            </ul>

            <h3 className="text-2xl font-bold mb-3 mt-6">3.2 Age Restriction</h3>
            <p>
              You must be at least 13 years old to use DamiTV. By using the Service, you represent 
              that you meet this age requirement.
            </p>

            <h3 className="text-2xl font-bold mb-3 mt-6">3.3 Account Security</h3>
            <p>
              While DamiTV does not require account creation for basic use, you are responsible for 
              maintaining the security of any information you provide to us.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">4. Content and Intellectual Property</h2>
            
            <h3 className="text-2xl font-bold mb-3 mt-6">4.1 Third-Party Content</h3>
            <p>
              DamiTV aggregates and provides links to third-party streaming sources. We do not host, 
              upload, or control the content available through these sources. The streaming content 
              is provided by third parties, and we are not responsible for its accuracy, legality, 
              or quality.
            </p>

            <h3 className="text-2xl font-bold mb-3 mt-6">4.2 Copyright Compliance</h3>
            <p>
              We respect intellectual property rights. If you believe that content on our Service 
              infringes your copyright, please refer to our{' '}
              <a href="/dmca" className="text-primary hover:underline">DMCA Notice</a> page for 
              information on how to submit a complaint.
            </p>

            <h3 className="text-2xl font-bold mb-3 mt-6">4.3 DamiTV Intellectual Property</h3>
            <p>
              The DamiTV website design, logo, and original content are owned by us and protected by 
              copyright, trademark, and other intellectual property laws. You may not copy, modify, 
              or distribute our original content without permission.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">5. Disclaimer of Warranties</h2>
            <p>
              DamiTV is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties or 
              representations about the accuracy, reliability, or availability of the Service. 
              Specifically:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We do not guarantee uninterrupted or error-free service</li>
              <li>We do not warrant that streams will always be available or functional</li>
              <li>We do not guarantee the quality or legality of third-party content</li>
              <li>We do not warrant that the Service is free from viruses or harmful components</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, DamiTV and its operators shall not be liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Any indirect, incidental, special, or consequential damages</li>
              <li>Loss of profits, data, or other intangible losses</li>
              <li>Damages resulting from your use or inability to use the Service</li>
              <li>Damages resulting from third-party content or links</li>
              <li>Any unauthorized access to or use of our servers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">7. Third-Party Links and Services</h2>
            <p>
              Our Service may contain links to third-party websites or services. We are not responsible 
              for the content, privacy policies, or practices of any third-party websites. You access 
              third-party links at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">8. Advertising</h2>
            <p>
              DamiTV displays advertisements to support our free service. By using our Service, you 
              acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Advertisements may appear throughout the website</li>
              <li>We use third-party advertising services that may use cookies and tracking</li>
              <li>We are not responsible for the content of third-party advertisements</li>
              <li>Using ad blockers may affect your experience on our Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">9. Modifications to Service</h2>
            <p>
              We reserve the right to modify, suspend, or discontinue any part of the Service at any 
              time without notice. We may also impose limits on certain features or restrict access 
              to parts or all of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">10. Termination</h2>
            <p>
              We may terminate or suspend your access to the Service immediately, without prior notice, 
              for any reason, including if you breach these Terms. Upon termination, your right to use 
              the Service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless DamiTV and its operators from any claims, damages, 
              losses, liabilities, and expenses (including legal fees) arising from your use of the Service 
              or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable international 
              laws, without regard to conflict of law provisions. Any disputes arising from these Terms 
              shall be resolved through binding arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of any material 
              changes by updating the "Last Updated" date. Your continued use of the Service after changes 
              constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">14. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision 
              shall be limited or eliminated to the minimum extent necessary so that these Terms shall 
              otherwise remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">15. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <ul className="list-none space-y-2 mt-4">
              <li>Email: <a href="mailto:legal@damitv.pro" className="text-primary hover:underline">legal@damitv.pro</a></li>
              <li>Contact Page: <a href="/contact" className="text-primary hover:underline">damitv.pro/contact</a></li>
            </ul>
          </section>

          <section className="bg-primary/10 p-6 rounded-lg mt-8">
            <h3 className="text-xl font-bold mb-2">Agreement</h3>
            <p>
              By using DamiTV, you acknowledge that you have read, understood, and agree to be bound by 
              these Terms of Service and our Privacy Policy.
            </p>
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default TermsOfService;