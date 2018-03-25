{{#markdown this}}
![BC Dev Exchange](https://bcdevexchange.org/modules/core/client/img/logo/new-logo-220px.png)

Good day!

A new *Code With Us* opportunity has been approved. 

- Title: **{{ data.name }}**
- Contract Manager: **{{ data.creator }}**
- BCDevX(PGO100): **${{ data.code }}**
- Posting Date: **{{ data.datePublished }}**
- Value of Opportunity: **{{ data.earn_format_money }}**
- Start Date: **{{ data.dateStart }}**
- Closing Date: **{{ data.dateDeadline }}**

[{{ opportunity.name }}]({{ opportunity.link }})

---

{{/markdown}}
