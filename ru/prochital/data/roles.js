const roles_names ={
    'kultr': "Окультуриваться",
    'ludi': "Понимать людей",
    'state':"Управлять состояними",
    'delo': "Строить организации",    
    'think': "Улучшать мозг",     
}
const roles_colors ={
    'ludi': "#bbe2cd",
    'state':"#deabe0",
    'delo': "lightblue",
    'kultr': "#ffbdc3",
    'think': "#fcc097",     
}

const cats_data = {
        "бизнес":{val:"bz", name:"Организации и бизнес"},
        "мировозрение":{ val:"mz", name:"Мировозрение и философия"},
        "жинеуправл":{ val:"lm", name:"Жизне-менеджмент"},
        "мышление":{ val:"th", name:"Мышление"},
        "отношения и люди":{ val:"rl", name:"Отношения с людьми"},
        "компьютер и дизайн":{val:"cd", name:"Компьютерное и Дизайн"},
        "арт":{ val:"ar", name:"Литература про искусство"},
        "практическая пси":{val:"pp", name:"Практическая психология"},
        "психология":{ val:"ps", name:"Психология"},
        "эзотерика":{ val:"ez", name:"Эзотерика и спорное"},
        "худла":{val:"hu", name:"Худлит"}
}

const roles ={
    'ludi': {
        'l_vzp':  ["Взаимопонимание","Перевогоры и медиация. Упр состояниями. Контакты с людьми. ННО и понимание"],
        'l_rzb':  ["Разнообразие групп","Описание людей, карт сознания. Соц тусовки как сети с центром. Как находить мне людей"],
        'l_lov':  ["Отношения с любовью","Любовь, радость, взподдержка. Отношения, которые складываются."]
    },     
    'state': {
        's_lif':  ["Пиковое и проживания","Впечатления и состояния. Пики. Проживание. Состояние свободы и отбор их. ЛМ и пение"],
        's_flw':  ["Арт Перфомативность потока","Поток. Музыка, танец, тантра и сексуальность. Перфоманс. Касания"],
        's_crt':  ["Буст креативности","Создание идей. Креативность и методы изобретательности.  Выразительность и Сильные идеи. Что я хочу сказать? написать? снять?"]
    }, 
    'delo': {
        'd_org':  ["Организации будущего","Новая экономика, бирюзовый труд, движенние ценностей и смысл. Как лучше людей организовать"],
        'd_suc':  ["Успешные компании","Стартапы. Успешные компании, как работают тут и организовывают процессы и людей. Накапливают силы, знания, ресурсы и АКТИВЫ"],
        'd_pol':  ["Моё полезно вокруг","Хит в сети. Сотрудничество для признания. Меня слышат, понимают и мое исп. Я полезен. Пишу для людей"]
    },
    'kultr': {
        'k_flw': ["Погрузиться в др мир", "Пройтись в чужом воображении"],
        'k_int': ["Быть в теме", "Почему это все читают?"],
        'k_eng': ["На английском", "Видеть как автор задумал. Расширять словарный запас"]
    }, 
    'think': {
        't_alz':  ["Анализировать","Расширенное мышление. Хранить и анализировать прошлое для улучшения СЕЙЧАС. Новые тех DS и визуализации"],
        't_emp':  ["Итерировать", "Натачивать инструмент. Эмперика и эксперементы. LEAN. Адаптация и автоматизация процессов. Динамич ответы-шаблоны 'получше'"],
        't_crt':  ["Критически оц","Мышление критическое. Вредные и полезные шаблоны. Сверхобщ. Схемы и алгоритмы. Понять и применить"],
        't_qst':  ["Ставить вопросы", "Коучинг и мышление вопросами. Осознаность своего и какой я. Где полезнее. "],
        't_chs':  ["Выбирать стратегии", "Как люди предсказывают и выбирают. Стратегии. Теор вер и антихрупкость. Защищеность и уверенность. Активы"]
    }
}