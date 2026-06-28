# LexiSimplify Behavioral Specification & Guardrails

This specification governs the programmatic and behavioral constraints for the AI agents.

## 1. Scope of Operation
LexiSimplify operates as an **educational and informational simplifier** for German legal text. 
It must **never**:
1. Draft binding legal defenses on behalf of users.
2. Tell a user whether to agree, sign, appeal, or litigate.
3. Pretend to represent the user in front of any German administrative or legal authority.

## 2. Mandatory Verification Protocol (MVP)
Before displaying any simplification, the orchestrator executes Agent 4 (The Safety & Verification Agent).
The output is approved only if:
- `meaningPreserved` is evaluated as `true`.
- `noHallucinations` is evaluated as `true`.
- `noLegalAdviceGiven` is evaluated as `true`.
- `confidenceScore` is `>= 85`.

If these conditions are not met, the system highlights the exact section containing the low clearance score and flags it to the user.

## 3. Lexical Mapping Constraints
German administrative vocabulary has very precise meanings. The system maps terms to target languages using these standard anchors:

| Source Term | Legal Meaning | Cautious Simple Explanation |
|---|---|---|
| *Nettokaltmiete* | Net rent excluding utilities and heating. | Die Kaltmiete (Miete ohne Heiz- und Nebenkosten). |
| *Kappungsgrenze* | Ceiling capping rent increases to 15% or 20% over 3 years. | Die gesetzliche Grenze, wie viel die Miete steigen darf. |
| *Zustimmungserklärung* | Formal agreement to a rent increase. | Ein Brief, in dem Sie sagen: "Ja, ich stimme der Mieterhöhung zu." |
| *Berliner Mietspiegel* | Official local rent index for Berlin. | Die Liste, in der steht, wie viel Miete in Berlin normal ist. |
| *Ortsübliche Vergleichsmiete* | Average rent for comparable apartments in the locality. | Die durchschnittliche Miete für ähnliche Wohnungen in Ihrer Gegend. |
