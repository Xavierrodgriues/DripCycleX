import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, HelpCircle, Mail, MapPin, MessageSquare, Phone, Send } from "lucide-react";
import { toast } from "sonner";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Reveal } from "@/components/reveal";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Order Query",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please complete all required fields.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Message Received", {
        description: `Thank you, ${formData.name}. Our support team will respond within 24 hours.`,
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "Order Query",
        message: "",
      });
    }, 600);
  };

  return (
    <div className="bg-background pb-24">
      {/* Header Banner */}
      <section className="border-b bg-surface py-16">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <span className="eyebrow text-primary">CLIENT SERVICES</span>
          <h1 className="display-xl mt-2 text-4xl sm:text-6xl">GET IN TOUCH WITH HEMMLOCK</h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl">
            Have questions about our garments, store fittings, or wholesale orders? We are here to assist.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Left Column: Contact Details & Info */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <span className="eyebrow text-primary">Direct Channels</span>
              <h2 className="display-xl mt-1 text-2xl sm:text-3xl">CUSTOMER CARE</h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Our support team operates from our Mumbai headquarters Monday through Saturday.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 border border-border bg-surface p-5">
                <div className="grid h-10 w-10 shrink-0 place-items-center bg-primary/10 text-primary">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Phone Support
                  </h4>
                  <a href="tel:+919820041120" className="text-sm font-semibold hover:underline block mt-0.5">
                    +91 98200 41120
                  </a>
                  <p className="text-[11px] text-muted-foreground mt-1">Mon – Sat, 10 AM – 7 PM IST</p>
                </div>
              </div>

              <div className="flex items-start gap-4 border border-border bg-surface p-5">
                <div className="grid h-10 w-10 shrink-0 place-items-center bg-primary/10 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Email Inquiries
                  </h4>
                  <a href="mailto:care@hemmlock.in" className="text-sm font-semibold hover:underline block mt-0.5">
                    care@hemmlock.in
                  </a>
                  <p className="text-[11px] text-muted-foreground mt-1">Response time: within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4 border border-border bg-surface p-5">
                <div className="grid h-10 w-10 shrink-0 place-items-center bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Headquarters
                  </h4>
                  <p className="text-sm text-foreground mt-0.5">
                    HEMMLOCK Apparel Pvt. Ltd.
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    102 High Street Corporate Park, Lower Parel, Mumbai 400013
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-ink bg-ink p-6 text-ink-foreground">
              <h4 className="display-xl text-lg text-primary">PRESS & WHOLESALE</h4>
              <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                For retail partnership proposals or press pull requests, write to <strong className="text-white">press@hemmlock.in</strong>
              </p>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-surface border border-border p-6 sm:p-10">
            <span className="eyebrow text-primary">Send a Message</span>
            <h2 className="display-xl mt-1 text-2xl sm:text-4xl">HOW CAN WE HELP?</h2>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="h-11 w-full border border-border bg-background px-4 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rahul@example.com"
                    className="h-11 w-full border border-border bg-background px-4 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="h-11 w-full border border-border bg-background px-4 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                    Subject Reason
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="h-11 w-full border border-border bg-background px-4 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="Order Query">Order & Delivery Query</option>
                    <option value="Store Visit">Store Visit & Styling Suite</option>
                    <option value="Sizing Help">Fit & Sizing Consultation</option>
                    <option value="Returns & Exchanges">Returns & Exchanges</option>
                    <option value="Wholesale">Wholesale & Business Inquiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                  Your Message *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can our client team assist you today?"
                  className="w-full border border-border bg-background p-4 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary py-4 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground hover:bg-ink transition-colors"
              >
                {loading ? "Sending..." : "Submit Inquiry"} <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="mt-24 border-t pt-16">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="eyebrow text-primary">Help & Answers</span>
            <h2 className="display-xl mt-2 text-3xl sm:text-5xl">FREQUENTLY ASKED QUESTIONS</h2>
          </div>

          <div className="max-w-3xl mx-auto border border-border bg-surface p-6 sm:p-8">
            <Accordion type="single" collapsible className="w-full divide-y">
              <AccordionItem value="item-1" className="border-b-0 py-2">
                <AccordionTrigger className="text-base font-bold text-foreground hover:text-primary text-left">
                  How do HEMMLOCK fits compare to standard sizing?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-2">
                  HEMMLOCK garments are engineered with relaxed, drop-shoulder silhouettes. If you prefer a tailored fit, we recommend ordering your true size. If you desire a slouchy streetwear aesthetic, order one size up. Refer to our interactive Size Guide on any product details page.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-b-0 py-2">
                <AccordionTrigger className="text-base font-bold text-foreground hover:text-primary text-left">
                  What is your return and exchange policy?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-2">
                  We offer a hassle-free 15-day return and exchange policy across India for unwashed, unworn garments with original tags intact. Pickup is scheduled from your doorstep free of charge.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-b-0 py-2">
                <AccordionTrigger className="text-base font-bold text-foreground hover:text-primary text-left">
                  Can I try garments in person before buying?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-2">
                  Yes! We operate 8 flagship concept stores located in Mumbai (Bandra West), Bengaluru (Indiranagar), New Delhi (Khan Market), Hyderabad, Kolkata, Chennai, Pune, and Ahmedabad. Visit our Store Locator page for store addresses and contact details.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-b-0 py-2">
                <AccordionTrigger className="text-base font-bold text-foreground hover:text-primary text-left">
                  How long does shipping take across India?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-2">
                  Standard express shipping takes 2-4 business days for major metro cities and 4-6 business days for rest of India. All orders over ₹1999 qualify for free express delivery.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border-b-0 py-2">
                <AccordionTrigger className="text-base font-bold text-foreground hover:text-primary text-left">
                  How do I care for my bio-washed heavyweight cotton pieces?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-2">
                  To preserve fabric weight and dye vibrance, machine wash cold with like colors inside-out. Line dry in shade and iron on reverse. Do not tumble dry high or dry clean unless specified on garment tag.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
