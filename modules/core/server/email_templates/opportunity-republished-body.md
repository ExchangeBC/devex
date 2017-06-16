{{#markdown this}}
![BC Dev Exchange](https://bcdevexchange.org/modules/core/client/img/logo/new-logo-220px.png)

### Hi {{data.username}}!

An opportunity you followed, {{ data.name }} has been republished!

### [See the details]({{ data.domain }}/opportunities/{{ data.code }})

[Unfollow this opportunity]({{ data.domain }}/api/unsubscribe/{{ data.subscriptionId }}) to stop receiving alerts. 

---

**Want to stop receiving these emails?**

[Unsubscribe now]({{ data.domain }}/api/unsubscribe/{{ data.subscriptionId }}) or manage notification preferences in your profile at [bcdevexchange.org](http://bcdevexchange.org).
{{/markdown}}