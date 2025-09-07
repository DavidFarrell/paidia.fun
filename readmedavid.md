There are three separate Hugo websites here.
hugo server to run locally
hugo to build

when you build it creates a public folder

Inside __landing_page_site is the main landing page with the two buttons.
Build that
then delete most of the stuff from root except these 

CNAME
__landing_page_site
__publisher_site
__public_site
readme.md
.gitmodules

then cut the contents of __landing_page_site/public and paste them in root


You do something similar for the other two sites.


Inside __publisher_site is the publisher page
You want to cut the contents out of that and paste them in "publishers" under root

Inside __public_site is the public facing website.
You want to cut the contents out of that and paste them in "players" under root

You used font-awesome for those wee icons at the bottom and with an account based on paidia.fun (i.e. games at that domain)

Note - to edit *this* file you do so in __landing_page_site/static/readmedavid.md