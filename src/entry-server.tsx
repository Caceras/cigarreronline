import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App, { allPaths } from './App';
import { HeadContext, headTags, type HeadData } from './lib/seo';

export { allPaths };

export function render(url: string) {
  const collector: { data?: HeadData } = {};
  const html = renderToString(
    <HeadContext.Provider value={collector}>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </HeadContext.Provider>,
  );
  return { html, head: collector.data ? headTags(collector.data) : '' };
}
