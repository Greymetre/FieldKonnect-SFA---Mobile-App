import * as React from "react"
import Svg, { Circle, ClipPath, Defs, G, Image, Mask, Path, Pattern, Rect, Use } from "react-native-svg"

function LogoIcon(props: any) {
  return (
    <Svg
      width={23}
      height={36}
      viewBox="0 0 23 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M22.648 13.067v9.582H11.324v13.067H0V13.067h22.648zm0-2.614H0V0h22.648v10.453z"
        fill={props?.color || "#fff"}
      />
    </Svg>
  )
}

function VillageIcon(props: any) {
  return (
    <Svg
      width={30}
      height={20}
      viewBox="0 0 30 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <G clipPath="url(#clip0_422_3014)" fill="#fff">
        <Path d="M17.427 15.19h1.742v1.743h-1.742V15.19zm6.023 0h1.743v1.743H23.45V15.19zm-1.462-6.18V7.268h-2.415v.849l.901.894 1.514-.001z" />
        <Path d="M27.96 18.427v-3.675h.554l.515-.509-6.102-6.101h-.757v1.057h-1.775l-1.058-1.057h-2.93l-6.095 6.095.516.515h.815v3.674h-1.592c-2.382-2.278-3.015-7.446-2.793-11.29l.04-.079h.019c1.041 0 1.965.505 2.54 1.284l.005.008c.434.586.695 1.323.695 2.121 0 .55-.124 1.07-.345 1.537l.009-.022a3.2 3.2 0 001.265-.65l-.005.004a3.544 3.544 0 001.217-2.677c0-.796-.261-1.53-.703-2.122l.007.01A3.091 3.091 0 008.567 5.4l.021-.006c.221-.137.475-.259.743-.352l.026-.008a3.304 3.304 0 013.453.744c.09-.468.063-.95-.078-1.405l.006.021a3.155 3.155 0 00-4.159-1.91l.021-.008c-.201.069-.397.153-.585.252l.024-.011a3.834 3.834 0 00-.25-.758l.01.024C7.064.34 5.382-.437 4.038.242a2.5 2.5 0 00-.908.791l-.005.009a3.05 3.05 0 012.316 1.46l.007.014a4.167 4.167 0 00-.982-.348l-.029-.005C2.372 1.72.405 2.842.052 4.676a3.117 3.117 0 00.091 1.51l-.006-.022a3.792 3.792 0 013.786-1.168l-.026-.006c.34.072.642.175.925.31l-.025-.01a3.425 3.425 0 00-3.43 1.7l-.01.017A3.833 3.833 0 00.822 8.97a3.86 3.86 0 001.64 3.162l.012.008c.427.287.914.472 1.424.54l.018.002a3.892 3.892 0 01-.56-2.02c0-.727.198-1.409.543-1.993l-.01.018a3.5 3.5 0 012.44-1.706l.02-.004c-1.18 5.378-1.507 9.124-.533 11.447H2.977v1.567h26.79v-1.567H27.96v.002zm-6.625-3.59h5.972v3.59h-5.972v-3.59zm-9.05-.711L16.408 10l4.125 4.125v4.3h-4.529V15.19h-2.29v3.237h-1.436v-4.301h.005z" />
      </G>
      <Defs>
        <ClipPath id="clip0_422_3014">
          <Path fill="#fff" d="M0 0H30V20H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

function TourPlanIcon(props: any) {
  return (
    <Svg
      width={64}
      height={58}
      viewBox="0 0 64 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M52.776 46.429C62.681 39 65.588 22.785 65.802 15.605H11.507c1.032 11.35-6.448 22.957-10.317 27.342-1.858 1.754-1.29 3.482 0 3.482h51.587z"
        fill="#3895D3"
      />
      <Path
        d="M65.802 56.23V34.564L59.87 45.138c-2.58 4.54-7.008 5.588-8.9 5.545H11.637v5.546c0 1.445 1.203 1.892 1.805 1.934h49.653c2.682 0 2.923-1.29 2.708-1.934zM52.39 0c1.14 0 2.063.924 2.063 2.063v2.064h11.22l.258 7.61H11.636v-7.61h11.35V2.063a2.064 2.064 0 014.126 0v2.064h9.543V2.063a2.064 2.064 0 014.127 0v2.064h9.544V2.063C50.326.923 51.25 0 52.39 0z"
        fill="#58CCED"
      />
    </Svg>
  )
}

function AddCustomerIcon(props: any) {
  return (
    <Svg
      width={68}
      height={74}
      viewBox="0 0 68 74"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Circle cx={34.1694} cy={16.5771} r={16.5771} fill="#3895D3" />
      <Path
        d="M46.855 39.583c3.873 0 7.45 1.264 10.343 3.4-9.614.43-17.277 8.361-17.277 18.082a18.052 18.052 0 005.892 13.363h-28.39C7.8 74.428 0 66.628 0 57.005c0-9.622 7.8-17.422 17.423-17.422h29.433z"
        fill="#3895D3"
      />
      <Circle cx={58.0201} cy={61.0655} r={9.9801} fill="#58CCED" />
    </Svg>
  )
}

function CustomerVisitIcon(props: any) {
  return (
    <Svg
      width={73}
      height={63}
      viewBox="0 0 73 63"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M5.006 19.249c3.554-.092 11.908-.11 16.893.554 2.308.092 6.841 1.33 6.51 5.539v11.355l7.477 3.738c.482.242 1.48.539 2.774.55-.887.96-1.57 2.183-1.376 3.478v.004c.188 1.174.75 2.682 1.748 3.669.24.237.507.445.802.612-1.275.161-3.23.035-5.748-.973L23.008 42.79v22.156H5.42V54.283c-1.939.323-5.733-.332-5.4-5.539-.047-5.585 0-18.39.553-24.926 0-1.523.887-4.569 4.432-4.569zM14.283 0a7.478 7.478 0 110 14.957 7.478 7.478 0 010-14.957z"
        fill="#3895D3"
      />
      <Path
        d="M69.397 19.803c2.816-.323 8.447.332 8.447 5.539v23.54c.231 1.556-.166 4.897-3.6 5.817l-1.8.969V65.5H54.442V42.79l-13.15 5.536a2.326 2.326 0 01-.25-.023c-.542-.082-1.017-.354-1.425-.758-.83-.822-1.342-2.142-1.513-3.21-.151-1.02.455-2.1 1.411-3.04.14-.136.286-.267.434-.393a9.314 9.314 0 001.891-.467l7.616-3.739V25.342c-.092-1.847.943-5.54 5.817-5.54h14.124zM63.027 0a7.478 7.478 0 11-.002 14.956A7.478 7.478 0 0163.027 0z"
        fill="#58CCED"
      />
    </Svg>
  )
}

function AdhocOrderIcon(props: any) {
  return (
    <Svg
      width={61}
      height={63}
      viewBox="0 0 61 63"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M31.5 56.782a6.217 6.217 0 11-12.435 0 6.217 6.217 0 0112.434 0zm-8.389 0a2.171 2.171 0 104.343 0 2.171 2.171 0 00-4.343 0zM54.434 56.782a6.217 6.217 0 11-12.435 0 6.217 6.217 0 0112.435 0zm-8.389 0a2.171 2.171 0 104.343 0 2.171 2.171 0 00-4.343 0z"
        fill="#58CCED"
      />
      <Path
        d="M9.81 12.434c1.215-.221 1.888.369 2.072.691l2.072 4.559.138-.006v.006c0 12.513 10.145 22.658 22.658 22.658 12.513 0 22.657-10.145 22.657-22.658 0-.59-.024-1.176-.068-1.755l.51-.02a3.039 3.039 0 013.054 3.82L56.368 44.21l-35.783 2.349-1.796 2.348h41.309a2.072 2.072 0 010 4.145H18.789c-5.747-.221-4.697-4.605-3.454-6.77l1.52-2.072L8.98 18.099H2.832a2.833 2.833 0 010-5.665H9.81z"
        fill="#3895D3"
      />
      <Path
        d="M36.75 0c9.766 0 17.683 7.917 17.683 17.684 0 9.767-7.917 17.684-17.684 17.684-9.766 0-17.684-7.917-17.684-17.684C19.065 7.917 26.983 0 36.75 0zm9.552 10.48a2.763 2.763 0 00-3.908 0l-7.465 7.465-3.71-3.62a2.763 2.763 0 00-3.86 3.955l5.47 5.336a3.04 3.04 0 004.271-.026l9.202-9.202a2.763 2.763 0 000-3.908z"
        fill="#58CCED"
      />
    </Svg>
  )
}

function Expenses(props: any) {
  return (
    <Svg
      width={65}
      height={67}
      viewBox="0 0 65 67"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M27.617 8.203H23.38v-2.46A5.742 5.742 0 0129.12 0H41.29a5.742 5.742 0 015.742 5.742v2.461H42.52v-2.46a1.64 1.64 0 00-1.641-1.641H29.258a1.64 1.64 0 00-1.64 1.64v2.461z"
        fill="#58CCED"
      />
      <Path
        d="M6.152 12.44h58.106C68.85 13.098 70 16.27 70 17.774v4.375c0 2.187-1.55 3.463-2.324 3.828l-16.543 4.649h-.265c-3.168-5.476-9.087-9.16-15.868-9.16-6.781 0-12.701 3.684-15.87 9.16h-.263c-3.236-.92-10.61-2.998-14.219-3.965C1.04 25.692.046 23.43 0 22.42v-4.648c.656-4.484 4.375-5.423 6.152-5.332z"
        fill="#3895D3"
      />
      <Path
        d="M67.129 59.472c0 2.507-1.668 7.52-8.34 7.52H10.391c-2.507.09-7.52-1.286-7.52-7.52V30.624l14.219 3.829h.379a18.315 18.315 0 00-.79 5.332c0 10.118 8.203 18.32 18.321 18.32 10.118 0 18.32-8.202 18.32-18.32 0-1.855-.276-3.645-.789-5.332h.242l14.356-3.829v28.848z"
        fill="#58CCED"
      />
      <Path
        d="M35 27.754c6.645 0 12.031 5.387 12.031 12.031 0 6.645-5.386 12.031-12.031 12.031-6.645 0-12.031-5.386-12.031-12.03 0-6.645 5.386-12.032 12.031-12.032zm-3.875 5.742l-.5 2.14h2.269c.74 0 1.27.18 1.591.537.117.127.212.267.288.42h-3.71l-.438 1.696h4.227a1.685 1.685 0 01-.807.951c-.308.17-.692.256-1.151.256h-2.062l-.006 1.524 4.171 4.964h2.872v-.109l-3.731-4.567.096-.038c.785-.17 1.422-.43 1.91-.78a3.11 3.11 0 001.079-1.311c.12-.273.21-.57.268-.89h1.31l.446-1.695h-1.732a3.582 3.582 0 00-.47-1.305c-.014-.025-.031-.049-.047-.073h1.804l.458-1.72h-8.135z"
        fill="#58CCED"
      />
    </Svg>
  )
}


function LeadIcon(props: any) {
  return (
    <Svg
      width={59}
      height={65}
      viewBox="0 0 59 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M28.663 32.716a13.318 13.318 0 00-26.636 0h26.636zM59.063 32.716a13.318 13.318 0 00-26.636 0h26.636z"
        fill="#58CCED"
      />
      <Circle cx={15.3449} cy={8.68571} r={8.68571} fill="#3895D3" />
      <Circle cx={45.7448} cy={8.68571} r={8.68571} fill="#3895D3" />
      <Path
        d="M60.655 42.27v-5.5H0v5.5l21.859 15.2V76l17.082-5.646V57.471l21.714-15.2z"
        fill="#3895D3"
      />
    </Svg>
  )
}

function NewsTileIcon(props: any) {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64" fill="none" {...props}>
      <Path d="M10 9h35a6 6 0 016 6v5h4a5 5 0 015 5v25a8 8 0 01-8 8H15a9 9 0 01-9-9V13a4 4 0 014-4z" fill="#58CCED" />
      <Path d="M51 25h4v25a3 3 0 01-6 0V15M16 21h23M16 30h23M16 39h15M16 48h19" stroke="#395299" strokeWidth={4} strokeLinecap="round" />
    </Svg>
  )
}



function ClockIcon(props: any) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M10 1.667a8.333 8.333 0 110 16.666 8.333 8.333 0 010-16.666zM10 5a.833.833 0 00-.834.833V10c0 .22.088.433.245.589l2.5 2.5a.833.833 0 001.178-1.178l-2.256-2.256V5.833A.833.833 0 0010 5z"
        fill="#fff"
      />
    </Svg>
  )
}

function LocationIcon(props: any) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M10 9.583a2.083 2.083 0 110-4.166 2.083 2.083 0 010 4.166zm0-7.917A5.833 5.833 0 004.167 7.5C4.167 11.875 10 18.333 10 18.333s5.833-6.458 5.833-10.833A5.833 5.833 0 0010 1.667z"
        fill="#fff"
      />
    </Svg>
  )
}


function ChatIcon(props: any) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M21.75 9a1.5 1.5 0 00-1.5-1.5h-3v-3a1.5 1.5 0 00-1.5-1.5h-12a1.5 1.5 0 00-1.5 1.5v12a.75.75 0 001.219.583l3.281-2.645v2.812a1.5 1.5 0 001.5 1.5h8.774l3.507 2.833a.75.75 0 001-.053.75.75 0 00.219-.53V9zm-3.99 8.417a.75.75 0 00-.468-.167H8.25v-3h7.5a1.5 1.5 0 001.5-1.5V9h3v10.43l-2.49-2.013z"
        fill="#D2DAEE"
      />
    </Svg>
  )
}

function CallIcon(props: any) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M18.328 22.5c-.915 0-2.2-.33-4.125-1.406-2.34-1.313-4.15-2.524-6.479-4.846C5.48 14.005 4.388 12.553 2.86 9.77c-1.727-3.14-1.432-4.787-1.103-5.49.392-.841.97-1.344 1.718-1.843a8.264 8.264 0 011.342-.713l.13-.057c.232-.104.583-.262 1.028-.093.298.111.563.34.978.75.852.84 2.016 2.71 2.445 3.63.289.618.48 1.027.48 1.486 0 .536-.27.95-.598 1.397-.061.084-.122.164-.181.242-.357.468-.435.604-.384.846.105.486.884 1.933 2.165 3.211 1.282 1.278 2.687 2.009 3.175 2.113.252.054.39-.028.874-.397.07-.053.14-.108.215-.163.5-.371.895-.634 1.419-.634h.002c.457 0 .847.197 1.494.524.844.425 2.77 1.574 3.616 2.427.41.414.64.678.752.975.169.447.01.797-.094 1.032l-.056.128a8.27 8.27 0 01-.717 1.34c-.498.745-1.003 1.322-1.846 1.715a3.16 3.16 0 01-1.385.303z"
        fill="#395299"
      />
    </Svg>
  )
}


function SearchSvgIcon(props: any) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M17.5 17.5l-5-5m-10-4.167a5.834 5.834 0 1011.667 0 5.834 5.834 0 00-11.667 0z"
        stroke="#fff"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}


function EyeIcon(props: any) {
  return (
    <Svg
      width={19}
      height={15}
      viewBox="0 0 19 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M9.332 0c4.813 0 7.557 3.295 8.762 5.259.76 1.23.76 2.783 0 4.012-1.205 1.964-3.949 5.26-8.762 5.26-4.814 0-7.556-3.296-8.762-5.26a3.815 3.815 0 010-4.012C1.776 3.295 4.518 0 9.332 0zm0 2.6a4.664 4.664 0 100 9.33 4.664 4.664 0 000-9.33zm0 1.555a3.11 3.11 0 110 6.22 3.11 3.11 0 010-6.22z"
        fill="#395299"
      />
    </Svg>
  )
}

function UploadIcon(props: any) {
  return (
    <Svg
      width={36}
      height={36}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M30.872 22.05v5.881a2.94 2.94 0 01-2.94 2.94H7.35a2.94 2.94 0 01-2.94-2.94v-5.88M24.99 11.76l-7.35-7.35-7.35 7.35M17.64 4.41v17.641"
        stroke="#64748B"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function ArrowCardDownIcon(props: any) {
  return (
    <Svg
      width={12}
      height={8}
      viewBox="0 0 12 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M1 1l4.68 4.68 4.467-4.466"
        stroke="#FBBC04"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  )
}

function CheckIcon(props: any) {
  return (
    <Svg
      width={20}
      height={19}
      viewBox="0 0 20 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M7.245.207a9.185 9.185 0 015.212.395c.625.239.842.982.524 1.57l-.04.072c-.318.588-1.051.795-1.688.588a6.681 6.681 0 104.35 4.497c-.186-.642.046-1.369.644-1.668l.073-.036c.599-.299 1.334-.057 1.552.576A9.185 9.185 0 117.245.207zm4.178 6.058c1.099-2.247 4.015-6.301 7.541-6.018.277.023.374.355.178.552-2.084 2.087-5.721 6.585-6.896 11.269a.895.895 0 01-.407.553L10.1 13.657a.882.882 0 01-1.225-.346c-.913-1.699-2.432-4.269-3.802-5.83-.332-.377-.33-.958.106-1.209.534-.308 1.261-.6 2.075-.64a.669.669 0 01.456.147c.605.492 1.74 1.72 2.774 3.802.11.219.326.448.543.335.137-.072.219-.25.106-.63-.22-.545-.477-1.87.212-2.889.03-.042.055-.086.078-.132z"
        fill={props?.color || "#395299"}
      />
    </Svg>
  )
}


function AddToCartIcon(props: any) {
  return (
     <Svg
      width={22}
      height={22}
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      {...props}
    >
      <Mask
        id="a"
        style={{
          maskType: "alpha"
        }}
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={22}
        height={22}
      >
        <Path fill="url(#pattern0_422_576)" d="M0 0H21.5582V21.5582H0z" />
      </Mask>
      <G mask="url(#a)">
        <Path
          fill="#fff"
          d="M-0.795898 2.89087H22.881301999999998V19.05057H-0.795898z"
        />
      </G>
      <Defs>
        <Pattern
          id="pattern0_422_576"
          patternContentUnits="objectBoundingBox"
          width={1}
          height={1}
        >
          <Use xlinkHref="#image0_422_576" transform="scale(.00195)" />
        </Pattern>
        <Image
          id="image0_422_576"
          width={512}
          height={512}
          preserveAspectRatio="none"
          xlinkHref="data:image/png;base64,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"
        />
      </Defs>
    </Svg>
  )
}


function CrossIconCard(props: any) {
  return (
    <Svg
      width={10}
      height={10}
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M8.068 9.368l-3.25-3.25-3.25 3.25a.919.919 0 11-1.299-1.3l3.25-3.25L.269 1.57a.92.92 0 111.3-1.3l3.25 3.25L8.067.269a.92.92 0 111.3 1.3l-3.25 3.25 3.25 3.249a.919.919 0 11-1.3 1.3z"
        fill="#FBBC04"
      />
    </Svg>
  )
}

function WhatsappICon(props: any) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <G clipPath="url(#clip0_422_555)">
        <Path
          d="M9.534 2.032a7.5 7.5 0 11-3.772 13.983l-3.725 1.017 1.014-3.726A7.5 7.5 0 019.534 2.032zM6.978 6.007l-.15.006a.75.75 0 00-.279.075.975.975 0 00-.22.17c-.09.085-.141.159-.196.23-.277.36-.427.804-.425 1.259.002.367.098.725.248 1.06.307.676.811 1.392 1.477 2.056.16.16.318.32.488.47a7.09 7.09 0 002.88 1.534l.426.065c.139.008.277-.003.417-.01.218-.011.432-.07.625-.173a3.73 3.73 0 00.287-.165s.032-.021.094-.067a1.72 1.72 0 00.247-.216.873.873 0 00.158-.227c.058-.122.117-.355.14-.55.019-.148.013-.23.011-.28-.003-.08-.07-.163-.142-.198l-.437-.196s-.652-.284-1.051-.466a.376.376 0 00-.132-.03.36.36 0 00-.284.095c-.004-.002-.054.041-.596.698a.263.263 0 01-.276.098 1.054 1.054 0 01-.143-.05l-.19-.08a4.502 4.502 0 01-1.18-.753c-.095-.083-.183-.173-.273-.26a4.726 4.726 0 01-.765-.95l-.044-.072a.75.75 0 01-.077-.154.24.24 0 01.046-.198s.182-.2.267-.308c.083-.105.152-.207.197-.28.089-.142.117-.288.07-.402a61.345 61.345 0 00-.65-1.53c-.045-.1-.176-.173-.296-.187a2.248 2.248 0 00-.424-.009l.152-.005z"
          fill="#fff"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_422_555">
          <Path fill="#fff" d="M0 0H19.0667V19.0667H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

function PlaceOrderIcon(props: any) {
  return (
    <Svg
      width={20}
      height={19}
      viewBox="0 0 20 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M5.464 15.443a1.52 1.52 0 11.001 3.042 1.52 1.52 0 01-.001-3.042zm7.604 0a1.52 1.52 0 11.001 3.04 1.52 1.52 0 010-3.04zM1.283 0c1.328 0 2.461.993 2.638 2.31l.2 1.493h5.385a1.14 1.14 0 110 2.281H4.424l.807 5.802c.025.187.187.33.376.33h7.794a1.9 1.9 0 001.845-1.44 1.141 1.141 0 012.213.554 4.177 4.177 0 01-4.058 3.167H5.607a2.672 2.672 0 01-2.638-2.31l-1.31-9.576a.381.381 0 00-.376-.33h-.142A1.14 1.14 0 111.14 0h.142zm14.299.94c.63 0 1.14.51 1.14 1.141v1.548h1.547a1.14 1.14 0 110 2.28h-1.546v1.549a1.14 1.14 0 11-2.28 0V5.91h-1.548a1.138 1.138 0 01-1.141-1.14c0-.63.51-1.142 1.14-1.141h1.547V2.08c0-.63.511-1.141 1.141-1.14z"
        fill={props?.color ? props?.color : "#395299"}
      />
    </Svg>
  )
}


function PhoneICon(props: any) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M12.46 3.728l-.562-.152-.306 1.126.564.152A2.917 2.917 0 0114.21 6.91l.152.563 1.126-.304-.152-.563a4.083 4.083 0 00-2.876-2.878zm-.533 1.97l-.563-.152-.305 1.126.564.153a.875.875 0 01.616.616l.151.563 1.127-.303-.152-.563a2.041 2.041 0 00-1.438-1.44z"
        fill="#fff"
      />
      <Path
        d="M8.122 3.7H3.117v.583a11.608 11.608 0 001.864 6.33c.9 1.39 2.083 2.573 3.473 3.473a11.609 11.609 0 006.33 1.864h.583v-5.005l-3.903-.867-1.085 1.085a8.226 8.226 0 01-2.474-2.475l1.084-1.085L8.122 3.7z"
        fill="#fff"
      />
    </Svg>
  )
}


function EmailIcon(props: any) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <G clipPath="url(#clip0_422_560)">
        <Path
          d="M3.533 15.532c-.412 0-.765-.147-1.059-.44a1.447 1.447 0 01-.44-1.06v-9c0-.413.146-.766.44-1.06.294-.293.647-.44 1.06-.44h12c.412 0 .765.147 1.06.44.293.295.44.648.44 1.06v9c0 .412-.147.765-.44 1.06a1.44 1.44 0 01-1.06.44h-12zm6-5.25l6-3.75v-1.5l-6 3.75-6-3.75v1.5l6 3.75z"
          fill="#fff"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_422_560">
          <Path fill="#fff" d="M0 0H19.0667V19.0667H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}


function PlusIcon(props: any) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Circle cx={12} cy={12} r={12} fill="#395299" />
      <Path
        d="M7 12h5m0 0h5m-5 0V7m0 5v5"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
function MinusIcon(props: any) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Circle cx={12} cy={12} r={12} fill="#395299" />
      <Path
        d="M7.779 12.129h8.7"
        stroke={"#fff"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function AddCartMiunsIcon(props: any) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Rect width={24} height={24} rx={12} fill="#E4EBFF" />
      <Path d="M7.537 12.888v-1.776h8.925v1.776H7.537z" fill="#395299" />
    </Svg>
  )
}

function FirstUserIcon(props: any) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 561 561"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M382.5 255c43.35 0 76.5-33.15 76.5-76.5S425.85 102 382.5 102 306 135.15 306 178.5s33.15 76.5 76.5 76.5zm-204 0c43.35 0 76.5-33.15 76.5-76.5S221.85 102 178.5 102 102 135.15 102 178.5s33.15 76.5 76.5 76.5zm0 51C119.85 306 0 336.6 0 395.25V459h357v-63.75C357 336.6 237.15 306 178.5 306zm204 0c-7.65 0-15.3 0-25.5 2.55 30.6 20.4 51 51 51 86.7V459h153v-63.75C561 336.6 441.15 306 382.5 306z"
        fill="#000000"
      />
    </Svg>
  )
}

function SecondUserIcon(props: any) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 439 439"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <G clipPath="url(#clip0_72_6661)" fill="#000000">
        <Path d="M219.265 219.267c30.271 0 56.108-10.71 77.518-32.121 21.412-21.411 32.12-47.248 32.12-77.515 0-30.262-10.708-56.1-32.12-77.516C275.366 10.705 249.528 0 219.265 0c-30.263 0-56.105 10.705-77.515 32.115-21.414 21.416-32.121 47.253-32.121 77.516 0 30.267 10.707 56.104 32.121 77.515 21.416 21.411 47.251 32.121 77.515 32.121z" />
        <Path d="M419.26 335.036c-.668-9.609-2.002-19.985-3.997-31.121-1.999-11.136-4.524-21.457-7.57-30.978-3.046-9.514-7.139-18.794-12.278-27.836-5.137-9.041-11.037-16.748-17.703-23.127-6.666-6.377-14.801-11.465-24.406-15.271-9.617-3.805-20.229-5.711-31.84-5.711-1.711 0-5.709 2.046-11.991 6.139a2716.072 2716.072 0 01-21.266 13.708c-7.898 5.037-18.182 9.609-30.834 13.695-12.658 4.093-25.361 6.14-38.118 6.14-12.752 0-25.456-2.047-38.112-6.14-12.655-4.086-22.936-8.658-30.835-13.695a2784.143 2784.143 0 01-21.267-13.708c-6.283-4.093-10.278-6.139-11.991-6.139-11.61 0-22.223 1.906-31.834 5.711-9.612 3.806-17.749 8.898-24.412 15.271-6.66 6.379-12.561 14.086-17.698 23.127-5.137 9.042-9.23 18.326-12.275 27.836-3.045 9.521-5.568 19.842-7.566 30.978-2 11.136-3.332 21.505-4 31.121a427.742 427.742 0 00-.997 29.554c0 22.836 6.948 40.875 20.841 54.104 13.897 13.224 32.36 19.835 55.39 19.835h249.534c23.027 0 41.49-6.611 55.388-19.835 13.901-13.229 20.845-31.265 20.845-54.104-.002-10.088-.334-19.938-1.008-29.554z" />
      </G>
      <Defs>
        <ClipPath id="clip0_72_6661">
          <Path fill="#000000" d="M0 0H438.529V438.529H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

function ThirdUserIcon(props: any) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 561 561"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M357 280.5c56.1 0 102-45.9 102-102s-45.9-102-102-102-102 45.9-102 102 45.9 102 102 102zm-229.5-51V153h-51v76.5H0v51h76.5V357h51v-76.5H204v-51h-76.5zm229.5 102c-68.85 0-204 33.15-204 102v51h408v-51c0-68.85-135.15-102-204-102z"
        fill="#000000"
      />
    </Svg>
  )
}

function FourthUserIcon(props: any) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 329 329"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <G clipPath="url(#clip0_73_33125)" fill="#000">
        <Path d="M310.199 18.71C297.735 6.244 282.65.009 264.951.009H63.954c-17.703 0-32.79 6.235-45.253 18.704C6.235 31.178 0 46.262 0 63.96v200.991c0 17.515 6.232 32.552 18.701 45.11 12.467 12.566 27.553 18.843 45.253 18.843h201.004c17.699 0 32.777-6.276 45.248-18.843 12.47-12.559 18.705-27.596 18.705-45.11V63.961c0-17.7-6.245-32.783-18.712-45.25zm-17.837 246.251c0 7.614-2.673 14.089-8.001 19.414-5.324 5.332-11.799 7.994-19.41 7.994H63.954c-7.614 0-14.082-2.662-19.414-7.994-5.33-5.325-7.992-11.8-7.992-19.414V63.966c0-7.613 2.662-14.086 7.992-19.414 5.327-5.327 11.8-7.994 19.414-7.994h201.004c7.61 0 14.086 2.663 19.41 7.994 5.325 5.328 7.994 11.8 7.994 19.414V264.96z" />
        <Path d="M246.683 146.19H182.73V82.237c0-2.667-.855-4.854-2.573-6.567-1.704-1.714-3.895-2.568-6.564-2.568h-18.271c-2.667 0-4.854.854-6.567 2.568-1.714 1.713-2.568 3.903-2.568 6.567v63.954H82.233c-2.664 0-4.857.855-6.567 2.568-1.711 1.713-2.568 3.903-2.568 6.567v18.271c0 2.666.854 4.855 2.568 6.563 1.712 1.708 3.903 2.57 6.567 2.57h63.954v63.953c0 2.666.854 4.855 2.568 6.563 1.713 1.711 3.903 2.566 6.567 2.566h18.271c2.67 0 4.86-.855 6.564-2.566 1.718-1.708 2.573-3.897 2.573-6.563v-63.952h63.953c2.662 0 4.853-.862 6.563-2.57 1.712-1.708 2.563-3.897 2.563-6.563v-18.271c0-2.664-.852-4.857-2.563-6.567-1.71-1.711-3.901-2.57-6.563-2.57z" />
      </G>
      <Defs>
        <ClipPath id="clip0_73_33125">
          <Path fill="#fff" d="M0 0H328.911V328.911H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

function SunnyIcon(props: any) {
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M8.778 12.436a3.659 3.659 0 01-3.657-3.658 3.659 3.659 0 013.657-3.657 3.659 3.659 0 013.658 3.657 3.66 3.66 0 01-3.658 3.658zm.732-9.51V.732A.734.734 0 008.778 0a.734.734 0 00-.731.732v2.194c0 .402.329.732.731.732.403 0 .732-.33.732-.732zm0 13.9V14.63a.734.734 0 00-.732-.731.734.734 0 00-.731.732v2.194c0 .402.329.732.731.732.403 0 .732-.33.732-.732zM3.658 8.777a.734.734 0 00-.732-.731H.732A.734.734 0 000 8.778c0 .403.33.732.732.732h2.194c.402 0 .732-.33.732-.732zm13.899 0a.734.734 0 00-.732-.731h-2.194a.734.734 0 00-.732.731c0 .403.33.732.732.732h2.194c.402 0 .732-.33.732-.732zM4.909 4.908a.728.728 0 000-1.03L3.445 2.413a.728.728 0 10-1.031 1.031L3.877 4.91c.146.146.33.212.52.212a.75.75 0 00.519-.212h-.007zm10.24 10.242a.728.728 0 000-1.032l-1.462-1.463a.729.729 0 10-1.032 1.032l1.463 1.463c.147.146.33.212.52.212a.75.75 0 00.52-.212h-.008zm-11.704 0l1.464-1.463a.729.729 0 10-1.032-1.032l-1.463 1.463a.728.728 0 00.52 1.244.75.75 0 00.519-.212h-.008zM13.687 4.909l1.463-1.464a.728.728 0 10-1.032-1.031l-1.463 1.463a.728.728 0 00.52 1.244.75.75 0 00.52-.212h-.008z"
        fill="#fff"
      />
    </Svg>
  )
}

function ProfileIcon(props: any) {
  return (
    <Svg
      width={15}
      height={20}
      viewBox="0 0 15 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M7.5 11.667a7.508 7.508 0 017.5 7.5c0 .46-.373.833-.833.833H.833A.833.833 0 010 19.167a7.508 7.508 0 017.5-7.5zM7.501 0a5 5 0 110 10 5 5 0 010-10z"
        fill="#3895D3"
      />
    </Svg>
  )
}

function ReportIcon(props: any) {
  return (
    <Svg
      width={17}
      height={20}
      viewBox="0 0 17 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M14.167 0H5.833a2.503 2.503 0 00-2.5 2.5v14.167h13.334V2.5c0-1.378-1.122-2.5-2.5-2.5zM7.5 14.167H5.833v-3.334H7.5v3.334zm3.333 0H9.167v-5h1.666v5zm3.334 0H12.5V10h1.667v4.167zm0-8.334l-1.078-1.077L10 7.845l-1.25-1.25-2.952 2.952V7.191L8.75 4.238 10 5.488l1.91-1.91L10.834 2.5h2.5c.46 0 .834.373.834.833v2.5zm-.834 12.5V20H0V5.945c0-1.158.686-2.144 1.667-2.612v15h11.666z"
        fill="#3895D3"
      />
    </Svg>
  )
}

function OrderHistoryIcon(props: any) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      {...props}
    >
      <Mask
        id="b"
        style={{
          maskType: "alpha"
        }}
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={20}
        height={20}
      >
        <Mask
          id="a"
          style={{
            maskType: "alpha"
          }}
          maskUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={20}
          height={20}
        >
          <Path fill="url(#pattern0_2017_301)" d="M0 0H20V20H0z" />
        </Mask>
        <G mask="url(#a)">
          <Path
            fill="#395299"
            d="M-1.75195 -1.71338H23.39015V21.71512H-1.75195z"
          />
        </G>
      </Mask>
      <G mask="url(#b)">
        <Path
          fill="#3895D3"
          d="M-2.85156 -6.27051H22.996940000000002V22.902389999999997H-2.85156z"
        />
      </G>
      <Defs>
        <Pattern
          id="pattern0_2017_301"
          patternContentUnits="objectBoundingBox"
          width={1}
          height={1}
        >
          <Use xlinkHref="#image0_2017_301" transform="scale(.00195)" />
        </Pattern>
        <Image
          id="image0_2017_301"
          width={512}
          height={512}
          preserveAspectRatio="none"
          xlinkHref="data:image/png;base64,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"
        />
      </Defs>
    </Svg>
  )
}

function DocumentsIcon(props: any) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      {...props}
    >
      <Mask
        id="a"
        style={{
          maskType: "alpha"
        }}
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={20}
        height={20}
      >
        <Path fill="url(#pattern0_841_7)" d="M0 0H20V20H0z" />
      </Mask>
      <G mask="url(#a)">
        <Path
          fill="#3895D3"
          d="M-2.66797 -1.5307H21.588729999999998V21.9285H-2.66797z"
        />
      </G>
      <Defs>
        <Pattern
          id="pattern0_841_7"
          patternContentUnits="objectBoundingBox"
          width={1}
          height={1}
        >
          <Use xlinkHref="#image0_841_7" transform="scale(.00195)" />
        </Pattern>
        <Image
          id="image0_841_7"
          width={512}
          height={512}
          preserveAspectRatio="none"
          xlinkHref="data:image/png;base64,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c6OHHHdhddLoEQAHNVsAOPyX56rq6dXj25/DvzYBALBYMz0E6PBfli9UL6p+qvrI4C3f6OQ2VyMAFmuWAHD4L8PlbT7e97XVK6pPj51zvR5W3X70CIBtzBIAN6t+ZPQIrtfnq49WV4wecoKeMnoAwLZmCYBPHH/Btk6rvmv0CIBtzfYQIGzr8fkTwMAKCAC4cX509ACAXRAAcOL+ZnW/0SMAdkEAwIn7p6MHAOyKAIAT86jqoaNHAOyKAIBv7eTqOaNHAOySAIBv7WnVA0aPANglAQA37OzqJ0ePANg1AQA37N9UZ40eAbBrAgCu32Or7x09AuAwCAC4bnesfrE6afAOgEMhAOCbnVK9pPq20UMADosAgG/209WDRo8AOEwCAL7eM6t/NHoEwGETAPA131M9d/QIgKMgAGDjkdWL8v8JYBJ+2EH9jerV1amjhwAcFQHA7J5Uvao6bfQQgKMkAJjZj1a/1OZtfwBTOTZ6AAxw0zZv9fuB0UMARhEAzOaO1UurB44eAjCSWwDM5G9X78jhDyAAmMK51YurV+Qv+wFUAoB1O9bmQb93V08evAVgr3gGgDU6qc17+3+quvfgLQB7SQCwJidVj6meXd1/8BaAvSYAWINbVE9oc7n/XoO3ACyCAGCpTq4urJ5SPb46fewcgGURACzJXdoc+hcd//e2Y+cALJcAYB+dVp1XnV/d/fjrQdWdBm4CWJU1BMDLqluOHsFWblGdWZ1x/OW9+gCHbA0BcEF19ugRALAkPggIACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIAACYkAABgQgIA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"
        />
      </Defs>
    </Svg>
  )
}

function LogoutIcon(props: any) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      {...props}
    >
      <Mask
        id="a"
        style={{
          maskType: "alpha"
        }}
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={20}
        height={20}
      >
        <Path fill="url(#pattern0_841_11)" d="M0 0H20V20H0z" />
      </Mask>
      <G mask="url(#a)">
        <Path
          fill="#3895D3"
          d="M-5.83301 -7.75433H26.269889999999997V24.32957H-5.83301z"
        />
      </G>
      <Defs>
        <Pattern
          id="pattern0_841_11"
          patternContentUnits="objectBoundingBox"
          width={1}
          height={1}
        >
          <Use xlinkHref="#image0_841_11" transform="scale(.00195)" />
        </Pattern>
        <Image
          id="image0_841_11"
          width={512}
          height={512}
          preserveAspectRatio="none"
          xlinkHref="data:image/png;base64,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"
        />
      </Defs>
    </Svg>
  )
}

function MspActicityIcon(props: any) {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      {...props}
    >
      <Mask
        id="a"
        style={{
          maskType: "alpha"
        }}
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={22}
        height={22}
      >
        <Path
          transform="matrix(-1 0 0 1 22 0)"
          fill="url(#pattern0_841_9)"
          d="M0 0H22V22H0z"
        />
      </Mask>
      <G mask="url(#a)">
        <Path
          fill="#3895D3"
          d="M-2.92871 -1.37152H23.64959V24.70098H-2.92871z"
        />
      </G>
      <Defs>
        <Pattern
          id="pattern0_841_9"
          patternContentUnits="objectBoundingBox"
          width={1}
          height={1}
        >
          <Use xlinkHref="#image0_841_9" transform="scale(.00195)" />
        </Pattern>
        <Image
          id="image0_841_9"
          width={512}
          height={512}
          preserveAspectRatio="none"
          xlinkHref="data:image/png;base64,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"
        />
      </Defs>
    </Svg>
  )
}

function OrderIcon(props:any) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      {...props}
    >
      <Mask
        id="b"
        style={{
          maskType: "alpha"
        }}
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={20}
        height={20}
      >
        <Mask
          id="a"
          style={{
            maskType: "alpha"
          }}
          maskUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={20}
          height={20}
        >
          <Path fill="url(#pattern0_2017_301)" d="M0 0H20V20H0z" />
        </Mask>
        <G mask="url(#a)">
          <Path
            fill="#395299"
            d="M-1.75195 -1.71338H23.39015V21.71512H-1.75195z"
          />
        </G>
      </Mask>
      <G mask="url(#b)">
        <Path
          fill="#3895D3"
          d="M-2.85156 -6.27051H22.996940000000002V22.902389999999997H-2.85156z"
        />
      </G>
      <Defs>
        <Pattern
          id="pattern0_2017_301"
          patternContentUnits="objectBoundingBox"
          width={1}
          height={1}
        >
          <Use xlinkHref="#image0_2017_301" transform="scale(.00195)" />
        </Pattern>
        <Image
          id="image0_2017_301"
          width={512}
          height={512}
          preserveAspectRatio="none"
          xlinkHref="data:image/png;base64,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"
        />
      </Defs>
    </Svg>
  )
}


export {
  LogoIcon, VillageIcon, TourPlanIcon, AddCustomerIcon, CustomerVisitIcon, SearchSvgIcon,
  AdhocOrderIcon, Expenses, LeadIcon, NewsTileIcon, ClockIcon, LocationIcon, ChatIcon, CallIcon,
  EyeIcon, CheckIcon, AddToCartIcon, ArrowCardDownIcon, CrossIconCard,
  PlaceOrderIcon,
  WhatsappICon, PhoneICon, EmailIcon, PlusIcon, MinusIcon, UploadIcon, AddCartMiunsIcon,
  FirstUserIcon,SecondUserIcon, ThirdUserIcon, FourthUserIcon, SunnyIcon,
  ProfileIcon, ReportIcon, OrderHistoryIcon, DocumentsIcon, LogoutIcon, MspActicityIcon, OrderIcon
}
