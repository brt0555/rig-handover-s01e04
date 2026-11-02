import type { DigestRow } from '../digest/types.js';

export function DigestPage({ night, rows, badLines }: { night: string; rows: DigestRow[]; badLines: number }) {
  const sortedRows = [...rows].sort((a, b) => a.job < b.job ? -1 : a.job > b.job ? 1 : 0);
  return (
    <>
      <h1>digest · {night}</h1>
      {badLines > 0 && <p class="warn">{badLines} unreadable {badLines === 1 ? 'line' : 'lines'} in run log</p>}
      {sortedRows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr><th>job</th><th>owner</th><th>runs</th><th>retries</th><th>last status</th><th>last error</th><th>first time</th><th>last time</th></tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const marked = row.retries >= 3 || row.lastStatus === 'fail';
              return (
                <tr class={marked ? 'warn' : undefined}>
                  <td>{row.job}</td><td>{row.owner ?? '—'}</td><td>{row.runs}</td><td>{row.retries}</td>
                  <td>{row.lastStatus}</td><td>{row.lastError ?? '—'}</td><td>{row.firstTime}</td><td>{row.lastTime}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
