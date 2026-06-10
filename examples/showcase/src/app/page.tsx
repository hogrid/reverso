import { TextSection } from '@/components/TextSection';
import { RichSection } from '@/components/RichSection';
import { ChoiceSection } from '@/components/ChoiceSection';
import { MediaSection } from '@/components/MediaSection';
import { DateSection } from '@/components/DateSection';
import { TeamSection } from '@/components/TeamSection';
import { FaqSection } from '@/components/FaqSection';
import { LinkSection } from '@/components/LinkSection';
import { MapSection } from '@/components/MapSection';

/**
 * Showcase home page.
 * Renders one section per family of Reverso field types so the full
 * scan -> admin -> edit -> frontend flow can be validated in one place.
 */
export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 space-y-16">
      <header className="text-center space-y-3">
        <h1 className="text-4xl font-bold">Reverso Field Showcase</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Every section below maps to a section of the <code>showcase</code> page and
          demonstrates a distinct set of editable field types.
        </p>
      </header>

      <TextSection />
      <RichSection />
      <ChoiceSection />
      <MediaSection />
      <DateSection />
      <TeamSection />
      <FaqSection />
      <LinkSection />
      <MapSection />
    </main>
  );
}
