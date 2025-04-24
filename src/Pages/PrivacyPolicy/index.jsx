import React from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '../../config';

const PrivacyPolicy = () => {
    const { t } = useTranslation();

    return (
        <div className='d-flex flex-column pd-horizontal py-4 slide-up'>
            <h3 className='bold-fw text-black'>Privacy Policy</h3>

            <div className='m-fs normal-fw text-black mt-4'>
                {/* Introduction */}
                <p>
                    Welcome to KebApp (“we,” “our,” “us”). We are committed to protecting your privacy and
                    ensuring that your personal data is handled securely, transparently, and in compliance
                    with applicable data protection laws. This Privacy Policy explains how we collect,
                    use, and safeguard your personal information when you use our platform.
                </p>
                <br /><br />

                {/* 1. Data We Collect */}
                <h5>1. Data We Collect</h5>
                <p>When you use KebApp, we may collect and process the following personal data:</p>

                <strong>1.1 Personal Data</strong>
                <ul>
                    <li><strong>Mobile Number:</strong> For user verification and communication.</li>
                    <li><strong>Email Address:</strong> To send important updates and offers.</li>
                    <li><strong>Address (optional):</strong> Provided by the user to enhance the user experience (e.g., geolocation-based offers).</li>
                    <li><strong>OTP Codes:</strong> For secure onboarding and verification.</li>
                </ul>

                <strong>1.2 Technical Data</strong>
                <ul>
                    <li><strong>IP Address:</strong> Collected for security and fraud prevention.</li>
                    <li><strong>Device Information:</strong> Including the operating system, browser type, and version.</li>
                    <li><strong>Usage Data:</strong> Information about how you interact with our platform, such as feature usage.</li>
                </ul>

                <strong>1.3 Location Data</strong>
                <ul>
                    <li><strong>Geolocation Data:</strong> If you enable location sharing, we collect your location to display nearby kebab shops and offers.</li>
                </ul>
                <br /><br />

                {/* 2. How We Use Your Data */}
                <h5>2. How We Use Your Data</h5>
                <p>We process your data for the following purposes:</p>

                <strong>2.1 Service Delivery</strong>
                <ul>
                    <li>To provide personalized recommendations of nearby kebab shops and offers.</li>
                    <li>To enable location-based functionality, such as “Get Directions” features.</li>
                </ul>

                <strong>2.2 Communication</strong>
                <ul>
                    <li>To send important notifications, such as updates, OTPs, and marketing emails (if you've opted in).</li>
                </ul>

                <strong>2.3 Security and Fraud Prevention</strong>
                <ul>
                    <li>To prevent unauthorized access or fraudulent activity on our platform.</li>
                </ul>

                <strong>2.4 Compliance</strong>
                <ul>
                    <li>To meet legal and regulatory obligations.</li>
                </ul>
                <br /><br />

                {/* 3. Legal Basis for Processing */}
                <h5>3. Legal Basis for Processing</h5>
                <p>We process your personal data based on the following GDPR principles:</p>
                <ul>
                    <li><strong>Consent:</strong> We will only process your personal data if you've provided explicit consent (e.g., for marketing emails or location sharing).</li>
                    <li><strong>Legitimate Interests:</strong> For purposes such as ensuring security, improving our platform, and delivering core services.</li>
                    <li><strong>Legal Obligations:</strong> To comply with applicable laws and regulatory requirements.</li>
                </ul>
                <br /><br />

                {/* 4. Data Sharing */}
                <h5>4. Data Sharing</h5>
                <p>We do not sell your data to third parties. However, we may share your data with the following entities when necessary:</p>

                <strong>4.1 Service Providers</strong>
                <ul>
                    <li><strong>Hosting Providers:</strong> For storing and processing data securely.</li>
                    <li><strong>IT and Security Providers:</strong> To ensure the security of the platform.</li>
                </ul>

                <strong>4.2 Legal Authorities</strong>
                <ul>
                    <li>If required to comply with legal obligations, such as responding to lawful requests or investigations.</li>
                </ul>
                <br /><br />

                {/* 5. Data Retention */}
                <h5>5. Data Retention</h5>
                <p>
                    We retain your personal data only for as long as it is necessary for the purposes outlined
                    in this Privacy Policy:
                </p>
                <ul>
                    <li><strong>Mobile Numbers and Emails:</strong> Stored until you delete your account or request deletion.</li>
                    <li><strong>Geolocation Data:</strong> Stored temporarily for delivering location-based services, then anonymized.</li>
                </ul>
                <p>
                    If you request the deletion of your data, it will be erased on your request,
                    except where retention is required by law.
                </p>
                <br /><br />

                {/* 6. Your Rights */}
                <h5>6. Your Rights</h5>
                <p>You have the following rights regarding your personal data:</p>
                <ul>
                    <li><strong>Right to Access:</strong> You can request a copy of your personal data.</li>
                    <li><strong>Right to Rectification:</strong> You can ask us to correct inaccurate data.</li>
                    <li><strong>Right to Erasure (“Right to Be Forgotten”):</strong> You can request the deletion of your data.</li>
                    <li><strong>Right to Data Portability:</strong> You can request your data in a portable format.</li>
                    <li><strong>Right to Object:</strong> You can object to data processing for marketing purposes.</li>
                    <li><strong>Right to Restrict Processing:</strong> You can request limited use of your data under certain conditions.</li>
                </ul>
                <p>
                    To exercise your rights, please contact us at:&nbsp;
                    <span
                        className="text-primary"
                    >
                        {config.CONTACT_EMAIL}
                    </span>
                </p>
                <br /><br />

                {/* 7. Security Measures */}
                <h5>7. Security Measures</h5>
                <p>We implement robust measures to protect your personal data:</p>
                <ul>
                    <li><strong>Encryption:</strong> Sensitive data, such as OTPs, is encrypted during transmission.</li>
                    <li><strong>Access Control:</strong> Only authorized personnel can access personal data.</li>
                    <li><strong>Regular Audits:</strong> We regularly evaluate our systems for potential vulnerabilities.</li>
                </ul>
                <br /><br />

                {/* 8. Data Deletion */}
                <h5>8. Data Deletion</h5>
                <p>
                    We respect your right to delete your data. Users can request the deletion of their data at
                    any time using the “Request Data Deletion” option in the application. Once requested, your
                    data will be deleted.
                </p>
                <br /><br />

                {/* 9. Updates to This Privacy Policy */}
                <h5>9. Updates to This Privacy Policy</h5>
                <p>
                    We may update this Privacy Policy periodically to reflect changes in legal requirements
                    or platform features. We will notify you of significant changes by posting the updated
                    policy on our platform.
                </p>
                <br /><br />

                {/* 10. Contact Us */}
                <h5>10. Contact Us</h5>
                <p>
                    For questions or concerns regarding this Privacy Policy, please contact us at:&nbsp;
                    <span
                        className="text-primary"
                    >
                        {config.CONTACT_EMAIL}
                    </span>
                </p>

                <p className="mt-2">
                    <strong>Last update:</strong> 27-01-2025
                </p>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
