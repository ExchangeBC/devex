{{#markdown this}}
![BC Dev Exchange](https://bcdevexchange.org/modules/core/client/img/logo/new-logo.png)

### Hi {{data.username}}!

You subscribed for updates on this opportunity:

**[{{ data.name }}]({{ data.domain }}/opportunities/{{ data.code }})**

It has been modified by the creator.

[Unfollow this opportunity]({{ data.domain }}/api/unsubscribe/{{ data.subscriptionId }})

---

**Want to stop receiving these emails?**

[Unsubscribe now]({{ data.domain }}/api/unsubscribe/{{ data.subscriptionId }}) or manage notification preferences in your profile at [bcdevexchange.org](http://bcdevexchange.org).
{{/markdown}}
