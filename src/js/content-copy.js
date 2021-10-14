(function () {
  "use strict";

  function makeTweet(author_name, author_handle, tweet_text, y_coord) {
    return `
        <div style="transform: translateY(${y_coord}px); position: absolute; width: 100%; transition: opacity 0.3s ease-out 0s;">
<div class="css-1dbjc4n r-j5o65s r-qklmqi r-1adg3ll r-1ny4l3l">
    <div class="css-1dbjc4n">
        <article aria-labelledby="id__lagn9vokqv id__g7pjc4fvp05 id__f30nk0soa1o id__azm2zld5fcf id__8mbcx8kzqih id__3nx4hp1m0o3 id__iil29dzsqzk id__yo9azubtas id__dpmepagx7oh id__ldpqfkzm71e id__nt77tuoa43s id__18lrbn9cknj" role="article" tabindex="0" class="css-1dbjc4n r-1loqt21 r-18u37iz r-1ny4l3l r-1udh08x r-1qhn6m8 r-i023vh r-o7ynqc r-6416eg" data-testid="tweet">
            <div class="css-1dbjc4n r-eqz5dr r-16y2uox r-1wbh5a2">
                <div class="css-1dbjc4n r-16y2uox r-1wbh5a2 r-1ny4l3l">
                    <div class="css-1dbjc4n">
                        <div class="css-1dbjc4n">
                            <div class="css-1dbjc4n r-18u37iz">
                                <div class="css-1dbjc4n r-1iusvr4 r-16y2uox r-ttdzmv"></div>
                            </div>
                        </div>
                        <div class="css-1dbjc4n r-18u37iz">
                            <div class="css-1dbjc4n r-1awozwy r-1hwvwag r-18kxxzh r-1b7u577">
                                <div class="css-1dbjc4n r-18kxxzh r-1wbh5a2 r-13qz1uu">
                                    <div class="css-1dbjc4n r-1wbh5a2 r-dnmrzs">
                                        <a href="/${author_handle}" aria-hidden="true" role="link" tabindex="-1" class="css-4rbku5 css-18t94o4 css-1dbjc4n r-14lw9ot r-sdzlij r-1loqt21 r-1adg3ll r-1ny4l3l r-1udh08x r-o7ynqc r-6416eg" style="height: 48px; width: 48px;">
                                            <div class="css-1dbjc4n r-sdzlij r-1adg3ll r-1udh08x" style="">
                                                <div class="r-1adg3ll r-13qz1uu" style="padding-bottom: 100%;"></div>
                                                <div class="r-1p0dtai r-1pi2tsx r-1d2f490 r-u8s1d r-ipm5af r-13qz1uu">
                                                    <div aria-label="" class="css-1dbjc4n r-sdzlij r-1p0dtai r-1mlwlqe r-1d2f490 r-1udh08x r-u8s1d r-zchlnj r-ipm5af r-417010">
                                                        <div class="css-1dbjc4n r-1niwhzg r-vvn4in r-u6sd8q r-4gszlv r-1p0dtai r-1pi2tsx r-1d2f490 r-u8s1d r-zchlnj r-ipm5af r-13qz1uu r-1wyyakw" style="background-image: url(&quot;https://pbs.twimg.com/profile_images/1296929570231390209/hNsDkcQg_x96.jpg&quot;);"></div>
                                                        <img alt="" draggable="true" src="https://pbs.twimg.com/profile_images/1296929570231390209/hNsDkcQg_x96.jpg" class="css-9pa8cd">
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="css-1dbjc4n r-1twgtwe r-sdzlij r-rs99b7 r-1p0dtai r-1mi75qu r-1d2f490 r-1ny4l3l r-u8s1d r-zchlnj r-ipm5af r-o7ynqc r-6416eg"></div>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div class="css-1dbjc4n r-1iusvr4 r-16y2uox r-1777fci r-kzbkwu">
                                <div class="css-1dbjc4n">
                                    <div class="css-1dbjc4n r-zl2h9q">
                                        <div class="css-1dbjc4n r-k4xj1c r-18u37iz r-1wtj0ep">
                                            <div class="css-1dbjc4n r-1d09ksm r-18u37iz r-1wbh5a2">
                                                <div class="css-1dbjc4n r-1wbh5a2 r-dnmrzs">
                                                    <a href="/${author_handle}" role="link" class="css-4rbku5 css-18t94o4 css-1dbjc4n r-1loqt21 r-1wbh5a2 r-dnmrzs r-1ny4l3l">
                                                        <div class="css-1dbjc4n r-1awozwy r-18u37iz r-1wbh5a2 r-dnmrzs r-1ny4l3l" id="id__azm2zld5fcf">
                                                            <div class="css-1dbjc4n r-1awozwy r-18u37iz r-dnmrzs">
                                                                <div dir="auto" class="css-901oao r-1awozwy r-18jsvk2 r-6koalj r-37j5jr r-a023e6 r-b88u0q r-rjixqe r-bcqeeo r-1udh08x r-3s2u2q r-qvutc0"><span class="css-901oao css-16my406 css-bfa6kz r-poiln3 r-bcqeeo r-qvutc0"><span class="css-901oao css-16my406 r-poiln3 r-bcqeeo r-qvutc0">${author_name}</span></span></div>
                                                                <div dir="auto" class="css-901oao r-18jsvk2 r-xoduu5 r-18u37iz r-1q142lx r-37j5jr r-a023e6 r-16dba41 r-rjixqe r-bcqeeo r-qvutc0">
                                                                    <svg viewBox="0 0 24 24" aria-label="Verified account" class="r-1cvl2hr r-4qtqp9 r-yyyyoo r-1xvli5t r-9cviqr r-f9ja8p r-og9te1 r-bnwqim r-1plcrui r-lrvibr">
                                                                        <g>
                                                                            <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"></path>
                                                                        </g>
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <div class="css-1dbjc4n r-18u37iz r-1wbh5a2 r-13hce6t">
                                                                <div dir="ltr" class="css-901oao css-bfa6kz r-14j79pv r-18u37iz r-37j5jr r-a023e6 r-16dba41 r-rjixqe r-bcqeeo r-qvutc0"><span class="css-901oao css-16my406 r-poiln3 r-bcqeeo r-qvutc0">@${author_handle}</span></div>
                                                            </div>
                                                        </div>
                                                    </a>
                                                </div>
                                                <div dir="auto" aria-hidden="true" class="css-901oao r-14j79pv r-1q142lx r-37j5jr r-a023e6 r-16dba41 r-rjixqe r-bcqeeo r-s1qlax r-qvutc0"><span class="css-901oao css-16my406 r-poiln3 r-bcqeeo r-qvutc0">·</span></div>
                                                <a href="/ewarren/status/1448012547651686406" dir="auto" aria-label="2 minutes ago" role="link" class="css-4rbku5 css-18t94o4 css-901oao r-14j79pv r-1loqt21 r-1q142lx r-37j5jr r-a023e6 r-16dba41 r-rjixqe r-bcqeeo r-3s2u2q r-qvutc0" id="id__3nx4hp1m0o3"><time datetime="2021-10-12T19:47:48.000Z">2m</time></a>
                                            </div>
                                            <div class="css-1dbjc4n r-1joea0r">
                                                <div class="css-1dbjc4n r-1awozwy r-6koalj r-18u37iz">
                                                    <div class="css-1dbjc4n">
                                                        <div class="css-1dbjc4n r-18u37iz r-1h0z5md">
                                                            <div aria-expanded="false" aria-haspopup="menu" aria-label="More" role="button" tabindex="0" class="css-18t94o4 css-1dbjc4n r-1777fci r-bt1l66 r-1ny4l3l r-bztko3 r-lrvibr" data-testid="caret">
                                                                <div dir="ltr" class="css-901oao r-1awozwy r-14j79pv r-6koalj r-37j5jr r-a023e6 r-16dba41 r-1h0z5md r-rjixqe r-bcqeeo r-o7ynqc r-clp7b1 r-3s2u2q r-qvutc0">
                                                                    <div class="css-1dbjc4n r-xoduu5">
                                                                        <div class="css-1dbjc4n r-1niwhzg r-sdzlij r-1p0dtai r-xoduu5 r-1d2f490 r-xf4iuw r-1ny4l3l r-u8s1d r-zchlnj r-ipm5af r-o7ynqc r-6416eg"></div>
                                                                        <svg viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi">
                                                                            <g>
                                                                                <circle cx="5" cy="12" r="2"></circle>
                                                                                <circle cx="12" cy="12" r="2"></circle>
                                                                                <circle cx="19" cy="12" r="2"></circle>
                                                                            </g>
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="css-1dbjc4n">
                                    <div class="css-1dbjc4n">
                                        <div dir="auto" class="css-901oao r-18jsvk2 r-37j5jr r-a023e6 r-16dba41 r-rjixqe r-bcqeeo r-bnwqim r-qvutc0" id="id__yo9azubtas" lang="en"><span class="css-901oao css-16my406 r-poiln3 r-bcqeeo r-qvutc0">${tweet_text}</span></div>
                                    </div>
                                    <div class="css-1dbjc4n"></div>
                                    <div class="css-1dbjc4n">
                                        <div aria-label="18 replies, 49 Retweets, 224 likes" role="group" class="css-1dbjc4n r-1ta3fxp r-18u37iz r-1wtj0ep r-1s2bzr4 r-1mdbhws" id="id__18lrbn9cknj">
                                            <div class="css-1dbjc4n r-18u37iz r-1h0z5md">
                                                <div aria-label="18 Replies. Reply" role="button" tabindex="0" class="css-18t94o4 css-1dbjc4n r-1777fci r-bt1l66 r-1ny4l3l r-bztko3 r-lrvibr" data-testid="reply">
                                                    <div dir="ltr" class="css-901oao r-1awozwy r-14j79pv r-6koalj r-37j5jr r-a023e6 r-16dba41 r-1h0z5md r-rjixqe r-bcqeeo r-o7ynqc r-clp7b1 r-3s2u2q r-qvutc0">
                                                        <div class="css-1dbjc4n r-xoduu5">
                                                            <div class="css-1dbjc4n r-1niwhzg r-sdzlij r-1p0dtai r-xoduu5 r-1d2f490 r-xf4iuw r-1ny4l3l r-u8s1d r-zchlnj r-ipm5af r-o7ynqc r-6416eg"></div>
                                                            <svg viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi">
                                                                <g>
                                                                    <path d="M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828c0 .108.044.286.12.403.142.225.384.347.632.347.138 0 .277-.038.402-.118.264-.168 6.473-4.14 8.088-5.506 1.902-1.61 3.04-3.97 3.043-6.312v-.017c-.006-4.367-3.43-7.787-7.8-7.788zm3.787 12.972c-1.134.96-4.862 3.405-6.772 4.643V16.67c0-.414-.335-.75-.75-.75h-.396c-3.66 0-6.318-2.476-6.318-5.886 0-3.534 2.768-6.302 6.3-6.302l4.147.01h.002c3.532 0 6.3 2.766 6.302 6.296-.003 1.91-.942 3.844-2.514 5.176z"></path>
                                                                </g>
                                                            </svg>
                                                        </div>
                                                        <div class="css-1dbjc4n r-xoduu5 r-1udh08x"><span data-testid="app-text-transition-container" style="transform: translate3d(0px, 0px, 0px); transition-property: transform; transition-duration: 0.3s;"><span class="css-901oao css-16my406 r-poiln3 r-n6v787 r-1cwl3u0 r-1k6nrdp r-1e081e0 r-qvutc0"><span class="css-901oao css-16my406 r-poiln3 r-bcqeeo r-qvutc0">18</span></span></span></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="css-1dbjc4n r-18u37iz r-1h0z5md">
                                                <div aria-expanded="false" aria-haspopup="menu" aria-label="49 Retweets. Retweet" role="button" tabindex="0" class="css-18t94o4 css-1dbjc4n r-1777fci r-bt1l66 r-1ny4l3l r-bztko3 r-lrvibr" data-testid="retweet">
                                                    <div dir="ltr" class="css-901oao r-1awozwy r-14j79pv r-6koalj r-37j5jr r-a023e6 r-16dba41 r-1h0z5md r-rjixqe r-bcqeeo r-o7ynqc r-clp7b1 r-3s2u2q r-qvutc0">
                                                        <div class="css-1dbjc4n r-xoduu5">
                                                            <div class="css-1dbjc4n r-1niwhzg r-sdzlij r-1p0dtai r-xoduu5 r-1d2f490 r-xf4iuw r-1ny4l3l r-u8s1d r-zchlnj r-ipm5af r-o7ynqc r-6416eg"></div>
                                                            <svg viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi">
                                                                <g>
                                                                    <path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22c.148.147.34.22.532.22s.384-.073.53-.22c.293-.293.293-.768 0-1.06l-3.5-3.5c-.293-.294-.768-.294-1.06 0l-3.5 3.5c-.294.292-.294.767 0 1.06s.767.293 1.06 0l2.22-2.22V16.7c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.337-.75-.75-.75z"></path>
                                                                </g>
                                                            </svg>
                                                        </div>
                                                        <div class="css-1dbjc4n r-xoduu5 r-1udh08x"><span data-testid="app-text-transition-container" style="transform: translate3d(0px, 0px, 0px); transition-property: transform; transition-duration: 0.3s;"><span class="css-901oao css-16my406 r-poiln3 r-n6v787 r-1cwl3u0 r-1k6nrdp r-1e081e0 r-qvutc0"><span class="css-901oao css-16my406 r-poiln3 r-bcqeeo r-qvutc0">49</span></span></span></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="css-1dbjc4n r-18u37iz r-1h0z5md">
                                                <div aria-label="224 Likes. Like" role="button" tabindex="0" class="css-18t94o4 css-1dbjc4n r-1777fci r-bt1l66 r-1ny4l3l r-bztko3 r-lrvibr" data-testid="like">
                                                    <div dir="ltr" class="css-901oao r-1awozwy r-14j79pv r-6koalj r-37j5jr r-a023e6 r-16dba41 r-1h0z5md r-rjixqe r-bcqeeo r-o7ynqc r-clp7b1 r-3s2u2q r-qvutc0">
                                                        <div class="css-1dbjc4n r-xoduu5">
                                                            <div class="css-1dbjc4n r-1niwhzg r-sdzlij r-1p0dtai r-xoduu5 r-1d2f490 r-xf4iuw r-1ny4l3l r-u8s1d r-zchlnj r-ipm5af r-o7ynqc r-6416eg"></div>
                                                            <svg viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi">
                                                                <g>
                                                                    <path d="M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478c0-3.064 2.525-5.754 5.403-5.754 2.29 0 3.83 1.58 4.646 2.73.814-1.148 2.354-2.73 4.645-2.73 2.88 0 5.404 2.69 5.404 5.755 0 6.376-7.454 13.11-10.037 13.157H12zM7.354 4.225c-2.08 0-3.903 1.988-3.903 4.255 0 5.74 7.034 11.596 8.55 11.658 1.518-.062 8.55-5.917 8.55-11.658 0-2.267-1.823-4.255-3.903-4.255-2.528 0-3.94 2.936-3.952 2.965-.23.562-1.156.562-1.387 0-.014-.03-1.425-2.965-3.954-2.965z"></path>
                                                                </g>
                                                            </svg>
                                                        </div>
                                                        <div class="css-1dbjc4n r-xoduu5 r-1udh08x"><span data-testid="app-text-transition-container" style="transform: translate3d(0px, 0px, 0px); transition-property: transform; transition-duration: 0.3s;"><span class="css-901oao css-16my406 r-poiln3 r-n6v787 r-1cwl3u0 r-1k6nrdp r-1e081e0 r-qvutc0"><span class="css-901oao css-16my406 r-poiln3 r-bcqeeo r-qvutc0">224</span></span></span></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="css-1dbjc4n r-18u37iz r-1h0z5md">
                                                <div aria-expanded="false" aria-haspopup="menu" aria-label="Share Tweet" role="button" tabindex="0" class="css-18t94o4 css-1dbjc4n r-1777fci r-bt1l66 r-1ny4l3l r-bztko3 r-lrvibr">
                                                    <div dir="ltr" class="css-901oao r-1awozwy r-14j79pv r-6koalj r-37j5jr r-a023e6 r-16dba41 r-1h0z5md r-rjixqe r-bcqeeo r-o7ynqc r-clp7b1 r-3s2u2q r-qvutc0">
                                                        <div class="css-1dbjc4n r-xoduu5">
                                                            <div class="css-1dbjc4n r-1niwhzg r-sdzlij r-1p0dtai r-xoduu5 r-1d2f490 r-xf4iuw r-1ny4l3l r-u8s1d r-zchlnj r-ipm5af r-o7ynqc r-6416eg"></div>
                                                            <svg viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi">
                                                                <g>
                                                                    <path d="M17.53 7.47l-5-5c-.293-.293-.768-.293-1.06 0l-5 5c-.294.293-.294.768 0 1.06s.767.294 1.06 0l3.72-3.72V15c0 .414.336.75.75.75s.75-.336.75-.75V4.81l3.72 3.72c.146.147.338.22.53.22s.384-.072.53-.22c.293-.293.293-.767 0-1.06z"></path>
                                                                    <path d="M19.708 21.944H4.292C3.028 21.944 2 20.916 2 19.652V14c0-.414.336-.75.75-.75s.75.336.75.75v5.652c0 .437.355.792.792.792h15.416c.437 0 .792-.355.792-.792V14c0-.414.336-.75.75-.75s.75.336.75.75v5.652c0 1.264-1.028 2.292-2.292 2.292z"></path>
                                                                </g>
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    </div>
    </div>
</div>
`;
  }
  // Your code here...
  console.log("Twitter Experiment Loaded!");
  // Pass in the target node, as well as the observer options
  var container = document.documentElement || document.body;
  // Configuration of the observer:
  var config = {
    attributes: false,
    childList: true,
    subtree: true,
    characterData: true,
  };
  //console.log(container);
  // Create an observer instance
  var observer = new MutationObserver(function (mutations) {
    console.log("changed");
    let timelineDiv = document.querySelectorAll(
      '[aria-label="Timeline: Your Home Timeline"]'
    )[0];
    if (timelineDiv != undefined) {
      observer.disconnect();
      let wrapper = document.createElement("div");
      wrapper.style.position = "relative";

      let tweet1 = makeTweet(
        "Elizabeth Warren (test)",
        "ewarren",
        "(test) We shouldn’t throw sand in the gears of what the American people support: increasing child care, expanding health care, fighting climate change, and getting billionaires and giant corporations to pay for it.",
        0
      );
      timelineDiv.innerHTML = "";
      timelineDiv.appendChild(wrapper);
      wrapper.innerHTML = tweet1;
      let h = wrapper.children[0].offsetHeight;

      console.log(h);
      let tweet2 = makeTweet(
        "CNN",
        "CNN",
        `From the CNN 5 Things podcast, these are the top headlines this evening:
✔️Social Security recipients to see biggest check increase since 1982
✔️CDC predicts continued decline in Covid-19 hospitalizations
✔️William Shatner goes to space

Listen now.`,
        h
      );
      // wrapper.appendChild(tweet2)

      console.log("hiding timelineDiv");
      observer.observe(container, config);
    }
  });
  observer.observe(container, config);
})();
