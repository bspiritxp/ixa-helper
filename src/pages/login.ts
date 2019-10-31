const Login = (jq$: CallableFunction|null) => {
    // use JQuery instead of the typed jq$ to bypass the invoke on possible null object issue
    // given we don't have control over document and other elements on the page.

    // TODO: research if there's another way to fix this, not by turning off the compile rule
      jQuery(document).ready(() => {
        if (location.pathname === '/false/login_sessionout.php') {
            location.href = 'http://sengokuixa.jp'
        }

        if (location.pathname === '/world/select_world.php') {
            const href = jQuery('.main_server').find('a').attr('href')
            location.href = 'http://world.sengokuixa.jp' + href
        }

        if (location.pathname === '/') {
            let href = jQuery('#btnObtEntry').find('a').attr('href')
            if (href === undefined) {
                href = jQuery('#btnGame').find('a').attr('href')
            }
            if (href === undefined) { return }
            location.href = 'http://sengokuixa.jp/' + href
        }

        if (location.pathname === '/index.php') {
            const href = jQuery('#btnGame').find('a').attr('href')
            if (href === undefined) { return }
            location.href = 'http://sengokuixa.jp/' + href
        }
    })
}

export default Login
