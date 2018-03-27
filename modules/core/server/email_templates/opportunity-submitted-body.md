{{#markdown this}}
![BC Dev Exchange](https://bcdevexchange.org/modules/core/client/img/logo/new-logo-220px.png)

Hello,

An opportunity, {{ data.name }} has been sent for approval.

* **Opportunity ID**: {{data.code}}
* **RFP Control**: {{data.rfp}}
* **Posting Date**: {{data.postingDate}}
* **Value Of Opportunity**: {{data.earn}}
* **Required Skills**: {{data.requiredSkills}}
* **Closing Date**: {{data.dateDeadline}} {{data.timeDeadline}}

### [See additional details]({{ data.domain }}/opportunities/{{ data.code }})

### [Agree]({{ data.domain }}/opportunities/{{ data.code }}/agree-url)
### [Disagree]({{ data.domain }}/opportunities/{{ data.code }}/disagree-url)
{{/markdown}}