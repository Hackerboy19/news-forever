# Slug cleanup worklist

Eight published articles whose slug begins or ends with a hyphen, or carries a
double hyphen. **Each one works right now** at the ugly URL — they are not
broken pages. What Search Console reported as 404 was a *different*, whitespace
version of the same link that some other site or an old sitemap pointed at.

## Read this before changing any of them

Editing a slug **changes the live URL**. The old one starts returning 404 and
whatever ranking it had is lost, unless a redirect is put in its place. Nothing
here is urgent: every one of these pages is reachable and indexable today. A
hyphen at the front of a URL is untidy, not harmful.

So this is worth doing only if you also want the redirect. Tell me which ones
you change and I will add a 301 from the old slug to the new one, the same way
/Miss-Universe-2026 now redirects.

## The eight

| # | Article | Slug now (works) | Suggested |
| --- | --- | --- | --- |
| 1 | #719 Dr Ritu Roy best homoeopath doctor in hajipur | `-best-homoeopathy-doctor-hajipur-dr-ritu-roy-` | `best-homoeopathy-doctor-hajipur-dr-ritu-roy` |
| 2 | #36 Vandana Jangada City winner Andhra Pradesh Miss  | `Vandana-Jangada-from-Andhra-Pradesh-won-the-Miss-India-2022-City-winner-title-` | `vandana-jangada-city-winner-andhra-pradesh-miss-india-2022` |
| 3 | #48 Meet Manushi Parmar our Trainer, 1st Runner-up M | `Meet-our-trainer-Manushi-Parmar-1st-Runner-Up-from-Forever-Miss-Teen-India-2022` | `meet-manushi-parmar-trainer-1st-runner-up-miss-teen-india-2022` |
| 4 | #329 Miss, Mrs and Miss Teen FSIA International Beaut | `Miss--Mrs-and-Miss-Teen-FSIA-International-Beauty-pageant-Grand-Finale-2023` | `miss-mrs-miss-teen-fsia-international-beauty-pageant-grand-finale-2023` |
| 5 | #525 Astrologer Yamini Sharma Honored with Super Woma | `-astrologer-yamini-sharma-honored-with-super-woman-award-in-dehradun` | `astrologer-yamini-sharma-honored-with-super-woman-award-in-dehradun` |
| 6 | #644 Tanvi Yatin Khairnar Crowned Forever Miss Teen I | `-tanvi-yatin-khairnar-miss-teen-india-2025` | `tanvi-yatin-khairnar-miss-teen-india-2025` |
| 7 | #536 International Fashion Show 2025 Comes to Jaipur: | `-jaipur-international-fashion-show-2025` | `jaipur-international-fashion-show-2025` |
| 8 | #533 Inspiring Personality Honoured with National Rec | `-inspiring-personality-honoured-with-forever-star-india-award-2025` | `inspiring-personality-honoured-with-forever-star-india-award-2025` |

## Two that need no slug change

| 404 URL Google reported | What it actually is |
| --- | --- |
| `Miss Teen India 2022 Manushi Parmar 1st Runner-Up` | Article #68 already lives at `miss-teen-india-2022-1st-runner-up-manushi-parmar` — a clean slug. The 404 is an old link with spaces; nothing to fix. |
| `divya-krishna-won-the-miss-andhra-pradesh-2022-state-winner` | Article #17 lives at `miss-andhra-pradesh-2022-winner-divya-krishna`. The 404 is an old slug from before it was renamed. A 301 would recover its ranking — ask me. |

## Where to do it

Admin → **Blog** → find the article → **Web address** field → Save.

The field is labelled with a warning for this exact reason: changing it breaks
old links.
