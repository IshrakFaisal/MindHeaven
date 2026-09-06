# Community support safety and access

MindHaven community posts are authenticated records, but member identity is hidden from readers behind a generated alias. This is pseudonymity, not database anonymity: the account link is retained for ownership, deletion, reporting, and safety controls.

## Access matrix

| Action | Member | Pending therapist | Verified therapist | Post author |
| --- | --- | --- | --- | --- |
| Read a public post | Yes | Yes | Yes | Yes |
| Read another person's private post | No | No | Yes | — |
| Create a public or private post | Yes | Yes | Yes | Yes |
| Write the single professional response | No | No | Yes | No |
| Add a public comment or direct message | No | No | No | No |
| Change visibility or delete a post | No | No | No | Yes |

Every post can hold one embedded professional response. The API claims that empty response slot atomically, so two professionals cannot both answer it.

## Verifying a professional

Professional signup records the declared specialization, workplace, registration authority, and registration number. It always creates a `pending` account; clients cannot grant themselves verified status.

An operator must review authoritative evidence outside the public interface. After the review, run:

```powershell
npm run therapist:verify -- professional@example.com
```

The verification script is intentionally separate from the public API. BMDC has warned that website self-verification is not an accepted substitute for registrar-signed verification, so a pasted registration number alone is not treated as proof: <https://www.bmdc.org.bd/upl/doc/news/TWDPJg23efU6.pdf>.

## Safety boundaries

- The composer requires acknowledgement that the board is not emergency care and a response is not guaranteed.
- Immediate-danger guidance directs people to seek local emergency help; detailed Bangladesh contacts remain in the dedicated Care toolkit.
- Posts should not contain names, phone numbers, addresses, or other identifying details.
- Professional responses are presented as general guidance and do not establish a therapist-client relationship.
- Signed-in readers can report unsafe content, harassment, misinformation, or spam. Reports are stored without exposing reporter identity through the community API.
- Account export includes a person's own posts and professional responses. Account deletion removes authored posts, reports made by that account, and responses written by a deleted professional.

The interaction model follows the privacy, consent, and human-rights principles in WHO's peer-support guidance: <https://www.who.int/publications/i/item/9789240025783>.
