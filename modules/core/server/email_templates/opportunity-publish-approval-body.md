{{#markdown this}}
![BC Dev Exchange](https://bcdevexchange.org/modules/core/client/img/logo/new-logo-220px.png)

A new *Code With Us* opportunity is pending and awaiting your approval.  Please review the information below, and choose *Agree* or *Disagree* to approve or deny publication of the opportunity.

### {{ data.opportunityId }}

- Associated RFP Control: **{{ data.rfp }}**
- Posting Date: **{{ data.postingDate }}**
- Value: **${{ data.value }}**
- Required Skills: **{{ data.requiredSkills }}**
- Closing Date: **{{ data.closingDate }}**

---

{{/markdown}}

<style>
    a {
        font: bold 14px Arial;
        text-decoration: none;
        background-color: #EEEEEE;
        color: #333333;
        padding: 2px 6px 2px 6px;
        border-top: 1px solid #CCCCCC;
        border-right: 1px solid #333333;
        border-bottom: 1px solid #333333;
        border-left: 1px solid #CCCCCC;
    }
</style>
<div width=100% align=center>
    <a href="{{ data.domain }}/opportunityadmin/{{ data.opportunityId }}/publishcwu">Agree</a>&nbsp;&nbsp;
    <a href="https://bcdevexchange.org/path/to/opp/deny">Disagree</a>
</div>