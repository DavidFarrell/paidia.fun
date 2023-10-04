Ok so the __hugo_site is the thing you edit
you spin up hugo -server -w and it runs it locally
hugo server --poll 700ms 

you run hugo and it builds it

You used font-awesome for those wee icons at the bottom and with an accound based on paidia.fun (i.e. games at that domain)


when it builds it it shoves it all in public
you can SAFELY delte *everything* in that root folder except

CNAME
__hugo_site
readme.md
.gitmodules

and you can then copy / paste all the stuff from public into that root folder