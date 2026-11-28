"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEventSession } from "@/components/EventSession";

export default function TermsPage() {
  const router = useRouter();
  const { event } = useEventSession();
  const eventId = event.id;
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  return (
      <main className="tc-page-wrapper">
        <div className="tc-card">
          <div className="tc-header">
            <div className="tc-meta">
              <span className="tc-badge">Event Access</span>
              <span className="tc-ref" title={eventId}>
                ID: {eventId}
              </span>
            </div>
            <h1 className="tc-title">Terms &amp; Conditions of Participation</h1>
            <p className="tc-subtitle">
              Please scroll through the agreement box below and accept the terms before joining the live event gallery.
            </p>
          </div>

          <div className="tc-box-container">
            <div className="tc-box-label-row">
              <span className="tc-box-label">Participant Agreement Document</span>
              <span className="tc-box-hint">Scroll to read</span>
            </div>

            <div className="tc-scroll-box" tabIndex={0} role="region" aria-label="Terms and Conditions Document">
              <section className="tc-section">
                <div className="tc-section-header">
                  <span className="tc-section-num">01</span>
                  <h2>Acceptance of Terms</h2>
                </div>
                <p>
                  By accessing and participating in this event gallery, you acknowledge that you have read, understood,
                  and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms,
                  please decline and exit the session immediately.
                </p>
              </section>

              <section className="tc-section">
                <div className="tc-section-header">
                  <span className="tc-section-num">02</span>
                  <h2>Media Submissions &amp; Usage Rights</h2>
                </div>
                <p>
                  Any photographs, videos, or digital content you capture or upload to this event gallery remain your
                  intellectual property. However, by submitting content, you grant the event organizer and fellow
                  authorized event participants a non-exclusive, royalty-free license to view, download, and share such
                  media in connection with the event.
                </p>
              </section>

              <section className="tc-section">
                <div className="tc-section-header">
                  <span className="tc-section-num">03</span>
                  <h2>Participant Conduct &amp; Content Guidelines</h2>
                </div>
                <p>
                  You agree to maintain respectful standards when contributing to the shared gallery. You must not
                  upload content that:
                </p>
                <ul className="tc-list">
                  <li>Infringes upon the privacy, publicity, or intellectual property rights of any third party.</li>
                  <li>Contains unlawful, defamatory, offensive, harassing, or inappropriate material.</li>
                  <li>Disrupts the integrity, security, or intended experience of the event platform.</li>
                </ul>
              </section>

              <section className="tc-section">
                <div className="tc-section-header">
                  <span className="tc-section-num">04</span>
                  <h2>Consent to Photograph Others</h2>
                </div>
                <p>
                  Please respect the personal boundaries and privacy of all attendees. Ensure that individuals featured
                  prominently in your submissions are aware of and comfortable with having their likeness uploaded to a
                  shared event space.
                </p>
              </section>

              <section className="tc-section">
                <div className="tc-section-header">
                  <span className="tc-section-num">05</span>
                  <h2>Moderation &amp; Removal</h2>
                </div>
                <p>
                  The event organizer reserves the full right to review, moderate, hide, or permanently remove any
                  submitted media at their sole discretion without prior notice if it is deemed inappropriate or out of
                  alignment with the event&apos;s guidelines.
                </p>
              </section>

              <section className="tc-section">
                <div className="tc-section-header">
                  <span className="tc-section-num">06</span>
                  <h2>Data Privacy &amp; Retention</h2>
                </div>
                <p>
                  Technical session identifiers and uploaded media are processed solely for delivering the gallery
                  service. Media is retained in accordance with the event organizer&apos;s configured retention schedule and
                  platform privacy standards.
                </p>
              </section>

              <section className="tc-section">
                <div className="tc-section-header">
                  <span className="tc-section-num">07</span>
                  <h2>Limitation of Liability</h2>
                </div>
                <p>
                  This platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. Neither the platform provider
                  nor the event organizer shall be liable for any incidental loss of uploaded data, network
                  interruptions, or unauthorized distribution of media by third-party attendees.
                </p>
              </section>
            </div>
          </div>

          <div className="tc-acknowledgment">
            <label className="tc-checkbox-label">
              <input
                type="checkbox"
                className="tc-checkbox-input"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <span className="tc-checkbox-box" aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" className="tc-checkbox-icon">
                  <path
                    d="M3.5 8.5L6.5 11.5L12.5 4.5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="tc-checkbox-text">
                I have read, understood, and formally agree to abide by the Event Terms &amp; Conditions, Content
                Guidelines, and Privacy Policy.
              </span>
            </label>
          </div>

          <div className="tc-actions">
            <button
              type="button"
              className="tc-btn tc-btn-decline"
              onClick={() => router.push(`/portal?event=${encodeURIComponent(eventId)}`)}
            >
              Back to login
            </button>
            <button
              type="button"
              className="tc-btn tc-btn-accept"
              disabled={!agreedToTerms}
              onClick={() => router.push(`/e/${encodeURIComponent(eventId)}/camera`)}
            >
              Accept &amp; Join Event <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </main>
  );
}
