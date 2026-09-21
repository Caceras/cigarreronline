import { Link } from 'react-router-dom';
import { Head } from '../lib/seo';

export default function NotFound() {
  return (
    <div className="container-x py-28 text-center">
      <Head path="/404/" title="Sidan finns inte | CigarrerOnline" description="Sidan kunde inte hittas." noindex />
      <p className="font-display italic text-7xl text-brass-light">404</p>
      <h1 className="text-4xl mt-4">Sidan finns inte</h1>
      <p className="text-muted mt-3">Den kan ha flyttats. Prova att börja om från sortimentet.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/cigarrer/" className="btn btn-ink">Cigarrer</Link>
        <Link to="/" className="btn btn-ghost">Startsidan</Link>
      </div>
    </div>
  );
}
