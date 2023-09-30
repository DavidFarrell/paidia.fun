Ok so the __landing_page_site is the thing you edit
you spin up hugo -server -w and it runs it locally
hugo server --poll 700ms 

you run hugo and it builds it

You used font-awesome for those wee icons at the bottom and with an accound based on paidia.fun (i.e. games at that domain)


when it builds it it shoves it all in public
you can SAFELY delte *everything* in that root folder except

CNAME
__landing_page_site
__publisher_site
__public_site
readme.md
.gitmodules

and you can then copy / paste all the stuff from public into that root folder - FOR LANDING PAGE

for publisher copy the public folder contents from __publisher_site  to publishers/ 
for players copy public folder contents from __public_site to players/

NOTE YOU EDIT THIS IN __LANDING_PAGE/STATIC/READMEDAVID.MD