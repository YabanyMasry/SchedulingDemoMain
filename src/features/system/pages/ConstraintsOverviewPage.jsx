import './ConstraintsOverviewPage.css'

// Read-only introduction to the scheduling engine. Mirrors the codes and behaviour defined
// in src/Modules/Timetable/.../Constraints/{Hard,Soft}/*.cs — keep wording in sync if a rule
// changes server-side. Hex / weight values intentionally not surfaced here; this page is for
// new operators to learn what the system enforces, not for tuning it.

const HC_CLASH = [
  {
    code: 'HC-1',
    title: 'Teacher double-booking',
    what: 'A teacher can never be in two lessons at the same period.',
    why: 'Physically impossible — they can only stand in one room.',
  },
  {
    code: 'HC-2',
    title: 'Class double-booking',
    what: 'A class cannot attend two lessons at the same period.',
    why: 'A student cannot be in two rooms at once. Reserve cohorts (placeholder classes) are exempt.',
  },
  {
    code: 'HC-3',
    title: 'Room double-booking',
    what: 'A room cannot host two lessons at the same period.',
    why: 'One physical space, one occupant. Shared "team rooms" are exempt.',
  },
]

const HC_AVAIL = [
  {
    code: 'HC-4',
    title: 'Teacher unavailable',
    what: 'A teacher hard-blocked for a (day, period) cannot be placed there.',
    why: 'Importance −3 in the availability matrix is treated as an absolute block.',
  },
  {
    code: 'HC-5',
    title: 'Class unavailable',
    what: 'A class hard-blocked for a (day, period) cannot be placed there.',
    why: 'Same as HC-4 but for a class — e.g. an off-site activity slot.',
  },
  {
    code: 'HC-6',
    title: 'Room unavailable',
    what: 'A room hard-blocked for a (day, period) cannot host any lesson there.',
    why: 'No exemption — the room either physically exists at that time or it does not.',
  },
  {
    code: 'HC-7',
    title: 'Subject unavailable',
    what: 'A subject hard-blocked for a (day, period) cannot be placed there.',
    why: 'Rare but valid — e.g. PE locked out of cognitively heavy morning slots.',
  },
]

const HC_LIMITS = [
  {
    code: 'HC-8',
    title: 'Teacher max-consecutive periods',
    what: 'A teacher cannot exceed their configured run of back-to-back teaching periods.',
    why: 'Prevents marathon teaching blocks. Break periods reset the counter.',
  },
  {
    code: 'HC-9',
    title: 'Class max-consecutive same subject',
    what: "A class cannot have more than the lesson's configured run of the same subject in a row.",
    why: 'E.g. "no more than 2 maths back-to-back" — supports learning variety.',
  },
  {
    code: 'HC-11',
    title: 'Teacher max periods/day',
    what: 'A teacher cannot exceed their configured maximum total periods on one day.',
    why: 'Workload cap independent of whether the periods are consecutive.',
  },
  {
    code: 'HC-12',
    title: 'Class max periods/day',
    what: 'A class cannot exceed its configured maximum total periods on one day.',
    why: 'Per-class daily load cap.',
  },
]

const HC_LOCK = [
  {
    code: 'HC-10',
    title: 'Locked lesson protection',
    what: 'A placement marked locked cannot be moved or removed.',
    why: 'Admin-pinned lessons (e.g. fixed staff meetings) must survive every regeneration.',
  },
]

const SC_COMPACT = [
  {
    code: 'SC-1',
    title: 'Minimise teacher gaps',
    what: "Penalises idle periods between a teacher's lessons on the same day.",
    why: 'A teacher free at periods 1, 2, then 5 has to wait through periods 3 and 4 — costly.',
  },
  {
    code: 'SC-2',
    title: 'Minimise class gaps',
    what: "Same as SC-1, but for each class's day.",
    why: "Students shouldn't sit through free slots between lessons.",
  },
]

const SC_SHAPE = [
  {
    code: 'SC-3',
    title: 'Punctuality (mornings first)',
    what: 'Each placement is penalised by how late in the day it falls.',
    why: 'Nudges the solver to fill morning slots before afternoon ones.',
  },
  {
    code: 'SC-6',
    title: 'Subject spread across week',
    what: 'Penalises clustering the same subject on the same day for one class.',
    why: 'Prefers Mon/Wed/Thu over three lessons stacked on a single day.',
  },
]

const SC_PREFS = [
  {
    code: 'SC-7',
    title: 'Honour soft availability',
    what: 'Rewards placements on preferred slots and penalises disfavoured ones.',
    why: 'Availability scores in the soft band (−2..+2) shift the score without blocking placement.',
  },
]

const SC_PENDING = [
  {
    code: 'SC-4',
    title: 'Double-period preference',
    what: 'Designed to reward placing a lesson in a block of consecutive periods.',
    why: "Currently a no-op — needs per-lesson min/max-block fields the schema doesn't carry yet.",
  },
  {
    code: 'SC-5',
    title: 'Room-type match',
    what: "Designed to reward matching a lesson's required room type (e.g. lab, gym).",
    why: 'Currently a no-op — needs a cross-module room-type lookup from Resource Management.',
  },
]

const ConstraintCard = ({ code, title, what, why, soft, badge }) => (
  <article className="co-card">
    <div className="co-card-head">
      <span className={`co-code ${soft ? 'co-code-soft' : ''}`}>{code}</span>
      <h4 className="co-card-title">{title}</h4>
      {badge}
    </div>
    <p className="co-card-what">{what}</p>
    <p className="co-card-why">{why}</p>
  </article>
)

const ConstraintsOverviewPage = () => (
  <section className="page-card">
    <h1>Scheduling Engine — Constraints &amp; Algorithm</h1>
    <p className="co-intro">
      The system places every lesson under two layers of rules. <strong>Hard constraints</strong>{' '}
      decide whether a placement is even legal — break them and the placement is rejected.
      <strong> Soft constraints</strong> never block a placement, but each one nudges the
      quality score: higher score = better timetable. This page lists every rule the engine
      checks today and how the solver uses them.
    </p>

    <div className="co-stack" style={{ marginTop: 18 }}>

      <div className="co-section">
        <h2>Hard rules</h2>
        <p className="co-section-subtitle">
          Twelve checks codified as <code>HC-1</code> through <code>HC-12</code>. Any violation
          rejects the placement. Three of them (the &ldquo;clash&rdquo; group) can never be
          overridden; the rest can be force-bypassed by an admin via the override flow.
        </p>

        <div className="co-group">
          <div className="co-group-title">
            <h3>Clash &mdash; physically impossible</h3>
            <span>never overridable</span>
          </div>
          <div className="co-grid">
            {HC_CLASH.map((c) => (
              <ConstraintCard
                key={c.code}
                {...c}
                badge={<span className="co-tag co-tag-blocking">blocking</span>}
              />
            ))}
          </div>
        </div>

        <div className="co-group">
          <div className="co-group-title">
            <h3>Availability blocks</h3>
            <span>hard-blocks set in the availability matrix</span>
          </div>
          <div className="co-grid">
            {HC_AVAIL.map((c) => (
              <ConstraintCard
                key={c.code}
                {...c}
                badge={<span className="co-tag co-tag-overridable">override allowed</span>}
              />
            ))}
          </div>
        </div>

        <div className="co-group">
          <div className="co-group-title">
            <h3>Capacity &amp; limits</h3>
            <span>daily / consecutive-period caps</span>
          </div>
          <div className="co-grid">
            {HC_LIMITS.map((c) => (
              <ConstraintCard
                key={c.code}
                {...c}
                badge={<span className="co-tag co-tag-overridable">override allowed</span>}
              />
            ))}
          </div>
        </div>

        <div className="co-group">
          <div className="co-group-title">
            <h3>Lock protection</h3>
            <span>admin-pinned placements</span>
          </div>
          <div className="co-grid">
            {HC_LOCK.map((c) => (
              <ConstraintCard
                key={c.code}
                {...c}
                badge={<span className="co-tag co-tag-overridable">override allowed</span>}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="co-section" style={{ marginTop: 6 }}>
        <h2>Soft preferences</h2>
        <p className="co-section-subtitle">
          Seven scoring rules codified as <code>SC-1</code> through <code>SC-7</code>. None of
          these block a placement &mdash; they shift the timetable&apos;s quality score, which is
          what the optimiser tries to maximise. Weights are configurable in{' '}
          <code>appsettings.json</code> under <code>Scheduling:SoftWeights</code>.
        </p>

        <div className="co-group">
          <div className="co-group-title">
            <h3>Compactness</h3>
            <span>fewer idle gaps</span>
          </div>
          <div className="co-grid">
            {SC_COMPACT.map((c) => (
              <ConstraintCard key={c.code} {...c} soft />
            ))}
          </div>
        </div>

        <div className="co-group">
          <div className="co-group-title">
            <h3>Day shape</h3>
            <span>when and how often lessons land</span>
          </div>
          <div className="co-grid">
            {SC_SHAPE.map((c) => (
              <ConstraintCard key={c.code} {...c} soft />
            ))}
          </div>
        </div>

        <div className="co-group">
          <div className="co-group-title">
            <h3>Preferences</h3>
            <span>soft-availability band</span>
          </div>
          <div className="co-grid">
            {SC_PREFS.map((c) => (
              <ConstraintCard key={c.code} {...c} soft />
            ))}
          </div>
        </div>

        <div className="co-group">
          <div className="co-group-title">
            <h3>Registered but inactive</h3>
            <span>reserved slots in the score</span>
          </div>
          <div className="co-grid">
            {SC_PENDING.map((c) => (
              <ConstraintCard
                key={c.code}
                {...c}
                soft
                badge={<span className="co-tag co-tag-pending">no-op</span>}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="co-section" style={{ marginTop: 6 }}>
        <h2>How a timetable is built</h2>
        <p className="co-section-subtitle">
          A generation run picks one algorithm and lets it work the whole timetable. The three
          available solvers complement each other &mdash; pick by what shape the timetable is in
          when you start.
        </p>

        <div className="co-pipeline">
          <div className="co-step">
            <div className="co-step-head">
              <span className="co-step-num">1</span>
              <h3>Greedy</h3>
            </div>
            <p>
              Starts from an empty week and places lessons one by one, picking the highest-scoring
              legal slot for each. Fast, deterministic, and a strong baseline.
            </p>
            <p className="co-step-purpose">
              Use when: building a fresh timetable from scratch.
            </p>
          </div>

          <div className="co-step">
            <div className="co-step-head">
              <span className="co-step-num">2</span>
              <h3>CSP</h3>
            </div>
            <p>
              Constraint-satisfaction backtracking. Tries placements, prunes branches that violate
              hard rules, and explores the search space more thoroughly than Greedy.
            </p>
            <p className="co-step-purpose">
              Use when: Greedy struggles to fit everything in the available slots.
            </p>
          </div>

          <div className="co-step">
            <div className="co-step-head">
              <span className="co-step-num">3</span>
              <h3>Simulated annealing</h3>
            </div>
            <p>
              Starts from an already-placed timetable and explores small moves (swap two lessons,
              relocate one) that lift the quality score. Accepts the occasional worse move early
              on to escape local minima, then settles.
            </p>
            <p className="co-step-purpose">
              Use when: polishing an existing timetable, not building one.
            </p>
          </div>
        </div>
      </div>

      <div className="co-callout" style={{ marginTop: 12 }}>
        <div>
          <h3>Overrides &mdash; what an admin can bypass</h3>
          <p>
            The three clash rules (<code>HC-1</code>, <code>HC-2</code>, <code>HC-3</code>) are
            never overridable: they represent physical impossibility. Every other hard rule can be
            force-bypassed by an admin in the placement editor or in substitute assignment, and
            each force-bypass is recorded in the audit log with the user and the codes ignored.
            Soft rules have no override &mdash; their effect is only on the score.
          </p>
        </div>
      </div>

    </div>
  </section>
)

export default ConstraintsOverviewPage
