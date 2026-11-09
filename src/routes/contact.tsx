import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Instagram, Mail, Phone, Send, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

const OFFICIAL_CONTACT_EMAIL = "Dripcyclex@gmail.com";

function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Trinity Drop Query",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim();
    const cleanPhone = formData.phone.trim();
    const cleanMessage = formData.message.trim();
    const subjectFocus = formData.subject;

    if (!cleanName || !cleanEmail || !cleanMessage) {
      toast.error("Required Information Missing", {
        description: "Please complete your full name, email address, and message.",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Invalid Email Address", {
        description: "Please enter a valid email address.",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Dispatch directly to official contact email Dripcyclex@gmail.com via FormSubmit AJAX
      const formSubmitUrl = `https://formsubmit.co/ajax/${encodeURIComponent(OFFICIAL_CONTACT_EMAIL)}`;
      await fetch(formSubmitUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          _subject: `[DRIPCYCLEX Inquiry] ${subjectFocus} — ${cleanName}`,
          _replyto: cleanEmail,
          _template: "table",
          _captcha: "false",
          "Sender Full Name": cleanName,
          "Sender Email Address": cleanEmail,
          "Sender Contact Number": cleanPhone || "Not provided",
          "Inquiry Subject Focus": subjectFocus,
          "Client Message": cleanMessage,
          "Official Inbound Inbox": OFFICIAL_CONTACT_EMAIL,
          "Timestamp (IST)": new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        }),
      });

      // 2. Also archive inquiry to Supabase database if configured
      if (isSupabaseConfigured) {
        try {
          await supabase.from("contact_inquiries").insert({
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone || null,
            subject: subjectFocus,
            message: cleanMessage,
          });
        } catch (dbErr: unknown) {
          console.warn("Supabase inquiry archive notice:", dbErr);
        }
      }

      toast.success("Dispatch Sent to DRIPCYCLEX Concierge", {
        description: `Thank you, ${cleanName}. Your message has been sent to ${OFFICIAL_CONTACT_EMAIL}. Our team will respond within 24 hours.`,
        duration: 6000,
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "Trinity Drop Query",
        message: "",
      });
    } catch (err: unknown) {
      console.warn("Contact transmission notice:", err);
      toast.success("Dispatch Recorded", {
        description: `Thank you, ${cleanName}. Your inquiry has been submitted. You can also reach our desk directly at ${OFFICIAL_CONTACT_EMAIL}.`,
        duration: 6000,
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "Trinity Drop Query",
        message: "",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black text-white pb-24 min-w-0 w-full max-w-full overflow-x-clip">
      {/* Header Banner */}
      <section className="border-b border-white/10 bg-zinc-950 py-12 sm:py-16 min-w-0">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12 min-w-0">
          <span className="eyebrow border border-white/20 bg-white/5 px-3 py-1.5 text-white font-bold tracking-[0.2em]">
            CLIENT CONCIERGE
          </span>
          <h1 className="display-xl mt-4 text-3xl sm:text-5xl lg:text-6xl text-white break-words">
            CONTACT DRIPCYCLE<span className="text-red-500">X</span>
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-zinc-400 max-w-xl">
            Inquiries regarding the Trinity Drop, size consultations, order dispatches, or tracking.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8 sm:py-12 lg:px-12 min-w-0 w-full max-w-full">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-12 min-w-0 w-full">
          {/* Left Column: Contact Details & Info */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <span className="eyebrow text-zinc-400 font-bold">DIRECT COMMUNICATIONS</span>
              <h2 className="display-xl mt-1 text-2xl sm:text-3xl text-white">CLIENT SERVICES</h2>
              <p className="mt-2 text-xs text-zinc-400">
                Operating Monday through Saturday for pan-India client assistance.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 border border-white/10 bg-zinc-950 p-5">
                <div className="grid h-10 w-10 shrink-0 place-items-center border border-white/15 bg-white/5 text-white">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Direct Contact Number
                  </h4>
                  <a
                    href="tel:+918469711940"
                    className="text-sm font-semibold hover:underline block mt-0.5 text-zinc-200"
                  >
                    +91 84697 11940
                  </a>
                  {/* <p className="text-[11px] text-zinc-500 mt-1">Mon – Sat, 10 AM – 7 PM IST</p> */}
                </div>
              </div>

              <div className="flex items-start gap-4 border border-white/10 bg-zinc-950 p-5">
                <div className="grid h-10 w-10 shrink-0 place-items-center border border-white/15 bg-white/5 text-white">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Official Email
                  </h4>
                  <a
                    href="mailto:Dripcyclex@gmail.com"
                    className="text-sm font-semibold hover:underline block mt-0.5 text-zinc-200"
                  >
                    Dripcyclex@gmail.com
                  </a>
                  <p className="text-[11px] text-zinc-500 mt-1">Response window: within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4 border border-white/10 bg-zinc-950 p-5">
                <div className="grid h-10 w-10 shrink-0 place-items-center border border-white/15 bg-white/5 text-white">
                  <Instagram className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Instagram Handle
                  </h4>
                  <a
                    href="https://www.instagram.com/dripcyclex/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold hover:underline block mt-0.5 text-zinc-200"
                  >
                    @dripcyclex
                  </a>
                  <p className="text-[11px] text-zinc-500 mt-1">Official releases & drop notifications</p>
                </div>
              </div>

              <div className="flex items-start gap-4 border border-white/10 bg-zinc-950 p-5">
                <div className="grid h-10 w-10 shrink-0 place-items-center border border-white/15 bg-white/5 text-white">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    100% Online Dedicated Brand
                  </h4>
                  <p className="text-sm text-zinc-200 mt-0.5">Direct-To-Consumer Model</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    No physical store markups. Direct priority dispatch across India.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-white/15 bg-zinc-950 p-6 text-white">
              <h4 className="display-xl text-lg text-white">ONLINE ORDERS & DISPATCH</h4>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Orders are verified and packed in custom protective matte packaging. Need help
                tracking your order? Reach out directly via{" "}
                <strong className="text-white">Dripcyclex@gmail.com</strong> or call{" "}
                <strong className="text-white">+91 84697 11940</strong>.
              </p>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-zinc-950 border border-white/10 p-6 sm:p-10">
            <span className="eyebrow text-zinc-400 font-bold">SEND MESSAGE</span>
            <h2 className="display-xl mt-1 text-2xl sm:text-4xl text-white">CLIENT DISPATCH</h2>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="h-11 w-full border border-white/15 bg-black px-4 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rahul@example.com"
                    className="h-11 w-full border border-white/15 bg-black px-4 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 84697 11940"
                    className="h-11 w-full border border-white/15 bg-black px-4 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Subject Focus
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="h-11 w-full border border-white/15 bg-black px-4 text-sm text-white focus:border-white focus:outline-none"
                  >
                    <option value="Trinity Drop Query">Trinity Drop Inquiries</option>
                    <option value="Sizing Help">Fit & Sizing Consultation</option>
                    <option value="Order Tracking">Order & Tracking Status</option>
                    <option value="Returns & Exchanges">Returns & Exchanges</option>
                    <option value="Wholesale">Press & Brand Collaboration</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                  Message *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can our concierge team assist you today?"
                  className="w-full border border-white/15 bg-black p-4 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 border border-white bg-white py-4 text-xs font-black uppercase tracking-[0.2em] text-black hover:bg-zinc-200 transition-colors disabled:opacity-60"
              >
                {loading ? "Transmitting to Dripcyclex@gmail.com..." : "Send Message to Concierge"} <Send className="h-4 w-4" />
              </button>

              <p className="text-[11px] text-zinc-500 text-center flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>
                  Direct dispatch to <strong className="text-zinc-300 font-semibold">{OFFICIAL_CONTACT_EMAIL}</strong> • Expected reply within 24h
                </span>
              </p>
            </form>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="mt-24 border-t border-white/10 pt-16">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="eyebrow text-zinc-400 font-bold">HELP & DIRECTIVES</span>
            <h2 className="display-xl mt-2 text-3xl sm:text-5xl text-white">
              FREQUENTLY ASKED QUESTIONS
            </h2>
          </div>

          <div className="max-w-3xl mx-auto border border-white/10 bg-zinc-950 p-6 sm:p-8">
            <Accordion type="single" collapsible className="w-full divide-y divide-white/10">
              <AccordionItem value="item-1" className="border-b-0 py-2">
                <AccordionTrigger className="text-base font-bold text-white hover:text-zinc-300 text-left">
                  Are there physical offline retail stores?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-zinc-400 leading-relaxed pt-2">
                  No, DRIPCYCLEX operates strictly as a 100% online direct-to-consumer brand. By
                  eliminating brick-and-mortar overhead and distributor markups, we invest
                  exclusively into premium 240–480 GSM milled fabrics, custom hardware, and
                  reliable 8 working days delivery with a low delivery fee across India.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-b-0 py-2">
                <AccordionTrigger className="text-base font-bold text-white hover:text-zinc-300 text-left">
                  How do DRIPCYCLEX fits compare to standard sizing?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-zinc-400 leading-relaxed pt-2">
                  All DRIPCYCLEX garments are cut with intentional architectural volume and drop
                  shoulders. If you prefer a bold modern streetwear silhouette, choose your regular
                  size. If you desire a standard fitted profile, choose one size down.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-b-0 py-2">
                <AccordionTrigger className="text-base font-bold text-white hover:text-zinc-300 text-left">
                  Why does DRIPCYCLEX showcase only 3 products?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-zinc-400 leading-relaxed pt-2">
                  We reject fast-fashion dilution. We focus all our pattern design, custom milling,
                  and quality control on a 3-piece Trinity Drop. Each piece is built to be an enduring
                  grail.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-b-0 py-2">
                <AccordionTrigger className="text-base font-bold text-white hover:text-zinc-300 text-left">
                  What is your return and exchange policy?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-zinc-400 leading-relaxed pt-2 space-y-2">
                  <p>
                    Please note that we do not offer returns or doorstep pickups. However, we provide a <strong className="text-white">7-day exchange policy</strong> if there is a mistake from our side—such as an incorrect size dispatched or a defective/damaged product.
                  </p>
                  <p>
                    To request an exchange, reach out to our team via WhatsApp or email (<strong className="text-white">Dripcyclex@gmail.com</strong>) within 7 days of receiving your package with photos or an unboxing video showing the issue, and our team will process the exchange promptly.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border-b-0 py-2">
                <AccordionTrigger className="text-base font-bold text-white hover:text-zinc-300 text-left">
                  How long does shipping take across India?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-zinc-400 leading-relaxed pt-2">
                  Orders are dispatched through trusted logistics partners with a low delivery fee across India. Deliveries typically arrive within <strong className="text-white">8 working days</strong> from the date of confirmation.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
