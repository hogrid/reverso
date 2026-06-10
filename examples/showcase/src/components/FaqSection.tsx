import { reverso } from '@/lib/reverso';

const FALLBACK_FAQ = [
  {
    question: 'What is Reverso?',
    answer: 'A reverse CMS that turns annotated markup into an editable content model.',
  },
  {
    question: 'How do I make a field editable?',
    answer: 'Add data-reverso and data-reverso-type attributes to the element.',
  },
];

/**
 * Repeater showcase: an FAQ list.
 * Markers use the `$` placeholder ONLY in the 3rd position and live INSIDE
 * the map callback. The repeater is read with items('showcase.faq', ...).
 */
export async function FaqSection() {
  const page = await reverso.getPage('showcase');
  const faqs = page.items('showcase.faq', FALLBACK_FAQ);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold">FAQ (repeater)</h2>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={`${faq.question ?? 'faq'}-${index}`}
            className="rounded-lg border border-slate-100 p-4"
          >
            <h3
              data-reverso="showcase.faq.$.question"
              data-reverso-type="text"
              data-reverso-label="Question"
              className="font-semibold"
            >
              {String(faq.question ?? 'Question')}
            </h3>
            <p
              data-reverso="showcase.faq.$.answer"
              data-reverso-type="textarea"
              data-reverso-label="Answer"
              className="mt-1 text-sm text-slate-600"
            >
              {String(faq.answer ?? '')}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
