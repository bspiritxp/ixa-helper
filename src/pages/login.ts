const Login = (jq$: CallableFunction|null) => {
      jQuery(document).ready(()=> {
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
